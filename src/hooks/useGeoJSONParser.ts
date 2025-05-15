import { useState, useEffect, useCallback } from 'react';
import WKT from 'wkt';
import type { GeoJSON, GeoJSONFeature, ParsedFeature, FieldDefinition, ParserError } from '../types/geojson';

const inferDataType = (values: any[]): string => {
  if (values.length === 0) return 'unknown';
  const types = new Set(values.map(v => {
    if (v === null || v === undefined) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  }));
  const nonNullTypes = new Set(Array.from(types).filter(t => t !== 'null'));
  if (nonNullTypes.size === 0 && types.has('null')) return 'null';
  if (nonNullTypes.size === 1) return nonNullTypes.values().next().value;
  if (nonNullTypes.size > 1) return 'mixed';
  return 'unknown';
};

export interface UseGeoJSONParserReturn {
  parsedFeatures: ParsedFeature[];
  propertyKeys: string[];
  fieldDefinitions: FieldDefinition[];
  parserError: ParserError | null;
  setFieldDefinitions: React.Dispatch<React.SetStateAction<FieldDefinition[]>>;
  resetParser: () => void;
}

export const useGeoJSONParser = (fileContent: string | null): UseGeoJSONParserReturn => {
  const [parsedFeatures, setParsedFeatures] = useState<ParsedFeature[]>([]);
  const [propertyKeys, setPropertyKeys] = useState<string[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [parserError, setParserError] = useState<ParserError | null>(null);

  const resetParser = useCallback(() => {
    setParsedFeatures([]);
    setPropertyKeys([]);
    setFieldDefinitions([]);
    setParserError(null);
  }, []);

  useEffect(() => {
    if (!fileContent) {
      resetParser();
      return;
    }

    try {
      setParserError(null); // Clear previous errors
      const parsedData = JSON.parse(fileContent) as GeoJSON;

      if (!parsedData || parsedData.type !== 'FeatureCollection' || !Array.isArray(parsedData.features)) {
        setParserError({ message: 'Invalid GeoJSON format: Must be a FeatureCollection.' });
        setParsedFeatures([]);
        setPropertyKeys([]);
        setFieldDefinitions([]);
        return;
      }

      const allKeys = new Set<string>();
      const processedFeatures: ParsedFeature[] = parsedData.features.map((feature, index) => {
        let wktString = '';
        try {
          if (feature.geometry) {
            wktString = WKT.stringify(feature.geometry);
          } else {
            console.warn(`Feature at index ${index} has no geometry.`);
            // Potentially set a specific error or flag for this feature
          }
        } catch (conversionError) {
          console.error(`Error converting geometry to WKT for feature at index ${index}:`, conversionError);
          wktString = 'Error: Could not convert geometry'; 
          // Optionally, bubble this up as a non-blocking error/warning for the specific feature
        }
        if (feature.properties) {
          Object.keys(feature.properties).forEach(key => allKeys.add(key));
        }
        return {
          id: index,
          wkt: wktString,
          properties: feature.properties,
        } as ParsedFeature;
      });

      setParsedFeatures(processedFeatures);
      const sortedKeys = Array.from(allKeys).sort();
      setPropertyKeys(sortedKeys);

      // Infer field definitions based on new keys and features
      let initialDefinitions: FieldDefinition[] = sortedKeys.map(key => {
        const values = processedFeatures
          .map(pf => pf.properties ? pf.properties[key] : undefined)
          .filter(value => value !== undefined);
        const type = inferDataType(values);
        return { name: key, inferredType: type, alias: key };
      });

      // Attempt to load and apply cached aliases
      try {
        const cachedDefsString = sessionStorage.getItem('geojsonFieldAliasesCache');
        if (cachedDefsString) {
          const cachedDefs: FieldDefinition[] = JSON.parse(cachedDefsString);
          const cacheMap = new Map(cachedDefs.map(def => [def.name, def.alias]));
          
          initialDefinitions = initialDefinitions.map(def => {
            if (cacheMap.has(def.name)) {
              return { ...def, alias: cacheMap.get(def.name)! };
            }
            return def;
          });
        }
      } catch (e) {
        console.warn('Failed to load or parse field aliases from sessionStorage:', e);
      }

      setFieldDefinitions(initialDefinitions);

    } catch (err) {
      console.error('Error parsing GeoJSON:', err);
      setParserError({ message: 'Error parsing GeoJSON file. Ensure it is valid JSON.', details: err as any });
      setParsedFeatures([]);
      setPropertyKeys([]);
      setFieldDefinitions([]);
    }
  }, [fileContent, resetParser]); // resetParser is stable due to useCallback

  return { parsedFeatures, propertyKeys, fieldDefinitions, parserError, setFieldDefinitions, resetParser };
}; 