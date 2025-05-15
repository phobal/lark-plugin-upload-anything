import { useState, useCallback } from 'react';
import { bitable, FieldType, ITable, IFieldConfig, IOpenCellValue } from '@lark-base-open/js-sdk';
import type { FieldDefinition, ParsedFeature } from '../types/geojson';
import { TFunction } from 'i18next';

interface UseFeishuBitableProps {
  parsedFeatures: ParsedFeature[];
  fieldDefinitions: FieldDefinition[];
  tableName: string;
  t: TFunction; // For internationalized messages
}

interface UseFeishuBitableReturn {
  isProcessing: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  createTableAndAddRecords: () => Promise<void>;
  resetMessages: () => void;
}

const mapInferredTypeToFeishuType = (inferredType: string): FieldType => {
  switch (inferredType) {
    case 'string':
      return FieldType.Text;
    case 'number':
      return FieldType.Number;
    case 'boolean':
      return FieldType.Checkbox;
    case 'object':
    case 'array':
    case 'mixed':
    case 'null':
    default:
      return FieldType.Text;
  }
};

export const useFeishuBitable = ({
  parsedFeatures,
  fieldDefinitions,
  tableName,
  t,
}: UseFeishuBitableProps): UseFeishuBitableReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetMessages = useCallback(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  const createTableAndAddRecords = useCallback(async () => {
    if (!parsedFeatures.length || !tableName.trim()) {
      setErrorMessage(t('feishu.error.noDataOrTableName', 'No data to upload or table name is empty.'));
      return;
    }
    setIsProcessing(true);
    resetMessages();

    try {
      const feishuFieldConfigs: IFieldConfig[] = fieldDefinitions.map(fieldDef => ({
        name: fieldDef.alias,
        type: mapInferredTypeToFeishuType(fieldDef.inferredType),
      } as IFieldConfig));

      const allFeishuFields: IFieldConfig[] = [
        ...feishuFieldConfigs,
        { name: 'WKT_Geometry', type: FieldType.Text } as IFieldConfig,
      ];

      const { tableId, index } = await bitable.base.addTable({
        name: tableName.trim(),
        fields: allFeishuFields,
      });

      if (!tableId) {
        throw new Error(t('feishu.error.failedToCreateTableNoId', 'Failed to create table: No tableId returned.'));
      }

      const newTable: ITable = await bitable.base.getTableById(tableId);
      const actualTableName = await newTable.getName();

      setSuccessMessage(t('feishu.success.tableCreatedFetchingIds', `Table '{{tableName}}' (ID: {{tableId}}) created. Fetching field IDs...`, { tableName: actualTableName, tableId }));
      
      const fieldMetaList = await newTable.getFieldMetaList();
      const fieldAliasToIdMap = new Map<string, string>();
      fieldMetaList.forEach(meta => {
        fieldAliasToIdMap.set(meta.name, meta.id);
      });

      if (fieldAliasToIdMap.size === 0 && allFeishuFields.length > 0) {
        console.warn('Field ID map is empty, but fields were expected. Records might not be added correctly.');
      }

      setSuccessMessage(t('feishu.success.fieldIdsMapped', `Table '{{tableName}}' field IDs mapped. Preparing records...`, { tableName: actualTableName }));
      
      const records = parsedFeatures.map(feature => {
        const recordFields: { [fieldId: string]: IOpenCellValue } = {};

        const wktFieldId = fieldAliasToIdMap.get('WKT_Geometry');
        if (wktFieldId) {
          recordFields[wktFieldId] = feature.wkt;
        } else {
          console.warn('Could not find Field ID for WKT_Geometry');
        }

        fieldDefinitions.forEach(fieldDef => {
          const fieldId = fieldAliasToIdMap.get(fieldDef.alias);
          if (!fieldId) {
            console.warn(`Could not find Field ID for alias: ${fieldDef.alias}. Skipping this field for record.`);
            return;
          }

          let rawValue = feature.properties ? feature.properties[fieldDef.name] : null;
          const feishuType = mapInferredTypeToFeishuType(fieldDef.inferredType);
          let cellValue: IOpenCellValue = null;

          if (rawValue !== null && rawValue !== undefined) {
            switch (feishuType) {
              case FieldType.Text:
                if (typeof rawValue === 'object' || Array.isArray(rawValue)) {
                  try {
                    cellValue = JSON.stringify(rawValue);
                  } catch (e) {
                    console.warn(`Could not stringify property ${fieldDef.name}:`, rawValue, e);
                    cellValue = t('feishu.error.stringifyError', 'Error: Could not stringify object');
                  }
                } else {
                  cellValue = String(rawValue);
                }
                break;
              case FieldType.Number:
                const num = parseFloat(String(rawValue));
                if (!isNaN(num)) {
                  cellValue = num;
                } else {
                  console.warn(`Could not parse ${rawValue} as number for ${fieldDef.alias}`);
                  cellValue = null; 
                }
                break;
              case FieldType.Checkbox:
                cellValue = Boolean(rawValue);
                break;
              default:
                cellValue = String(rawValue);
            }
          }
          recordFields[fieldId] = cellValue;
        });
        return { fields: recordFields };
      });

      if (records.length > 0) {
        await newTable.addRecords(records);
        setSuccessMessage(
          t('feishu.success.tableCreatedAndRecordsAdded', `Table '{{tableName}}' created and {{count}} records added successfully!`, { tableName: actualTableName, count: records.length })
        );
        console.log(`${records.length} records added to table '${actualTableName}'.`);
      } else {
        setSuccessMessage(
          t('feishu.success.tableCreatedNoRecords', `Table '{{tableName}}' created, but no records were prepared or added.`, { tableName: actualTableName })
        );
        console.log(`No records were prepared for table '${actualTableName}'.`);
      }
    } catch (error: any) {
      console.error('Error creating table or adding records in Feishu:', error);
      setErrorMessage(t('feishu.error.generalError', `Error: {{message}}`, { message: error.message || t('feishu.error.unknownError', 'An unknown error occurred.') }));
    } finally {
      setIsProcessing(false);
    }
  }, [parsedFeatures, fieldDefinitions, tableName, t, resetMessages]);

  return { isProcessing, successMessage, errorMessage, createTableAndAddRecords, resetMessages };
}; 