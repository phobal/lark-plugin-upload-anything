import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
// No longer directly used here: bitable, FieldType, ITable, IFieldConfig, IOpenCellValue

// Import Hooks
import { useGeoJSONFileUploader } from '../../hooks/useGeoJSONFileUploader'
import { useGeoJSONParser } from '../../hooks/useGeoJSONParser'
import { useFeishuBitable } from '../../hooks/useFeishuBitable' // New Hook
import { useTheme } from '../../contexts/ThemeContext' // Import useTheme
import WktPreview from '../common/WktPreview'
import GeometryModal from '../common/GeometryModal'

// Import Types
import type { FieldDefinition, ParsedFeature } from '../../types/geojson'

// Removed GeoJSON interface duplicate, assuming it's in types/geojson.ts or not needed here
// Removed inferDataType, as it's not directly used by Home.tsx anymore

const handleAliasChange = (
  originalName: string, 
  newAlias: string, 
  setFieldDefinitions: React.Dispatch<React.SetStateAction<FieldDefinition[]>>
) => {
  setFieldDefinitions(prevDefs => {
    const newDefs = prevDefs.map(def => 
      def.name === originalName ? { ...def, alias: newAlias } : def
    );
    try {
      sessionStorage.setItem('geojsonFieldAliasesCache', JSON.stringify(newDefs));
    } catch (e) {
      console.warn('Failed to save field aliases to sessionStorage:', e);
    }
    return newDefs;
  });
};

const Home = () => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme() // Use theme hook

  const {
    selectedFile,
    fileContent,
    error: fileUploaderError,
    handleFileChange: onFileSelected,
    // reset: resetUploader, 
  } = useGeoJSONFileUploader()

  const {
    parsedFeatures,
    propertyKeys, 
    fieldDefinitions,
    parserError,
    setFieldDefinitions, 
    // resetParser, 
  } = useGeoJSONParser(fileContent)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalWktString, setModalWktString] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');

  // Feishu Table Name State
  const [feishuTableName, setFeishuTableName] = useState<string>(''); // Default will be set by useEffect

  // Use the new Feishu hook
  const {
    isProcessing: isCreatingTable, // Renaming for consistency with old variable name if preferred
    successMessage: feishuSuccessMessage,
    errorMessage: feishuErrorMessage,
    createTableAndAddRecords: handleCreateTableInFeishu, // Function to trigger Feishu ops
    resetMessages: resetFeishuMessages, // Optional: to clear messages manually if needed
  } = useFeishuBitable({
    parsedFeatures,
    fieldDefinitions,
    tableName: feishuTableName,
    t, // Pass the t function for internationalized messages from the hook
  });

  useEffect(() => {
    if (selectedFile) {
      const nameParts = selectedFile.name.split('.');
      let nameWithoutExtension = selectedFile.name;
      if (nameParts.length > 1) {
        nameWithoutExtension = nameParts.slice(0, -1).join('.');
      }
      setFeishuTableName(nameWithoutExtension || t('home.feishu.defaultTableName', 'GeoJSON Imported Data'));
    } else {
      setFeishuTableName(t('home.feishu.defaultTableName', 'GeoJSON Imported Data'));
    }
  }, [selectedFile, t]);

  const openGeometryModal = (wkt: string, title?: string) => {
    setModalWktString(wkt);
    setModalTitle(title || t('home.modal.defaultTitle', 'Feature Geometry'));
    setIsModalOpen(true);
  };

  const closeGeometryModal = () => {
    setIsModalOpen(false);
    setModalWktString(null);
    setModalTitle('');
  };

  // Removed mapInferredTypeToFeishuType (moved to useFeishuBitable hook)
  // Removed handleCreateTableInFeishu (now from useFeishuBitable hook)

  const displayError = fileUploaderError || parserError
  const memoizedPropertyKeys = useMemo(() => propertyKeys, [propertyKeys])

  // Effect to clear Feishu messages when new file is selected or content changes, to avoid showing old messages
  useEffect(() => {
    if(resetFeishuMessages) resetFeishuMessages();
  }, [fileContent, resetFeishuMessages]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 p-4 sm:p-8 flex flex-col items-center transition-colors duration-300">
      <div className="w-full max-w-5xl">
        <header className="mb-6 sm:mb-10 text-center relative">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="absolute top-0 right-0 mt-2 mr-2 sm:mt-0 sm:mr-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            title={t('home.theme.toggle', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode')}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 6.75A5.25 5.25 0 0012 17.25a5.25 5.25 0 000-10.5z" />
              </svg>
            )}
          </button>

          <div className="inline-block p-3 mb-4 text-5xl text-blue-500 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0-8.25L12.75 3M9 6.75L5.25 3M9 6.75L3 10.5m6-3.75L3 15m0 0V21m6-6.75L5.25 18m3.75-3.75L12.75 15m3-3.75L12.75 3m0 0L15 6.75m-2.25-3.75L15 10.5m2.25-3.75L21 10.5m-2.25-3.75L15 15m6 .75V21m-5.25-3.75L15 18m3.75 3.75L21 15m-3.75 3.75L18.75 18m2.25-3L21 12m-3 3.75L21 12" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-300">
            {t('home.title', 'GeoJSON Parser & Viewer')}
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('home.subtitle', 'Upload your GeoJSON files to parse data, visualize geometries, and prepare for table integration.')}</p>
        </header>
        
        <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-800 shadow-xl dark:shadow-2xl rounded-xl border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <label htmlFor="geojson-upload" className="block mb-3 text-lg font-semibold text-blue-600 dark:text-blue-300">
            {t('home.uploadLabel', 'Upload GeoJSON or JSON file')}
          </label>
          <input
            id="geojson-upload"
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            onChange={onFileSelected}
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 hover:file:bg-blue-600 file:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 placeholder-gray-500 dark:placeholder-slate-400 transition-colors duration-300"
            disabled={isCreatingTable}
          />
        </div>

        {displayError && (
          <div className="my-6 p-4 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 dark:bg-opacity-50 border border-red-300 dark:border-red-700 rounded-lg shadow-lg transition-colors duration-300">
            <p><span className="font-bold">{t('home.error.title', 'Error:')}</span> {displayError.message}</p>
          </div>
        )}

        {selectedFile && !fileContent && !fileUploaderError && !isCreatingTable && (
           <div className="my-6 p-4 text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 border border-blue-300 dark:border-blue-700 rounded-lg shadow-lg transition-colors duration-300">
            <p>{t('home.status.selectedFile', 'Selected file: {{fileName}} - Reading file...', { fileName: selectedFile.name })}</p>
          </div>
        )}
        {fileContent && parsedFeatures.length === 0 && !parserError && !fileUploaderError && !isCreatingTable && (
          <div className="my-6 p-4 text-teal-700 dark:text-teal-200 bg-teal-100 dark:bg-teal-900 dark:bg-opacity-50 border border-teal-300 dark:border-teal-700 rounded-lg shadow-lg transition-colors duration-300">
            <p>{t('home.status.fileLoadedProcessing', 'File {{fileName}} loaded - Processing GeoJSON data...', { fileName: selectedFile?.name })}</p>
          </div>
        )}
        
        {fieldDefinitions.length > 0 && !isCreatingTable && (
          <div className="mt-10 mb-8 bg-gray-50 dark:bg-slate-800 shadow-xl dark:shadow-2xl rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-1 text-blue-600 dark:text-blue-300">{t('home.fieldAnalysis.title', 'Field Analysis & Naming')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('home.fieldAnalysis.description', 'Review inferred data types and set aliases for field names to be used in the output table.')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-700 transition-colors duration-300">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.fieldAnalysis.table.originalName', 'Original Field Name')}</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.fieldAnalysis.table.inferredType', 'Inferred Data Type')}</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.fieldAnalysis.table.fieldAlias', 'Field Alias (for output table)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 transition-colors duration-300">
                  {fieldDefinitions.map((field, index) => (
                    <tr key={field.name} 
                        className={`hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors duration-150 
                                    ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'}`}>
                      <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{field.name}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 font-mono text-xs">{field.inferredType}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <input 
                          type="text" 
                          value={field.alias} 
                          onChange={(e) => handleAliasChange(field.name, e.target.value, setFieldDefinitions)} 
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm placeholder-gray-400 dark:placeholder-slate-400 transition-colors duration-300" 
                          disabled={isCreatingTable}
                          placeholder={t('home.fieldAnalysis.table.aliasPlaceholder', 'Enter alias')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {parsedFeatures.length > 0 && !isCreatingTable && (
          <div className="mt-10 p-6 bg-gray-50 dark:bg-slate-800 shadow-xl dark:shadow-2xl rounded-xl border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-green-600 dark:text-green-400">{t('home.feishu.exportTitle', 'Export to Feishu Base')}</h2>
            <div className="mb-4">
              <label htmlFor="feishuTableName" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('home.feishu.tableNameLabel', 'New Table Name in Feishu:')}</label>
              <input 
                type="text" 
                id="feishuTableName" 
                value={feishuTableName} 
                onChange={(e) => setFeishuTableName(e.target.value)} 
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 dark:focus:border-green-400 sm:text-sm placeholder-gray-400 dark:placeholder-slate-400 transition-colors duration-300"
                placeholder={t('home.feishu.tableNamePlaceholder', 'Enter table name for Feishu')}
                disabled={isCreatingTable}
              />
            </div>
            <button 
              onClick={handleCreateTableInFeishu} 
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreatingTable || !feishuTableName.trim() || !parsedFeatures.length}
            >
              {isCreatingTable ? t('home.feishu.buttonCreating', 'Creating Table...'): t('home.feishu.buttonCreate', 'Create Table & Add Records in Feishu')}
            </button>
          </div>
        )}

        {isCreatingTable && (
          <div className="my-6 p-4 text-yellow-700 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-50 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg transition-colors duration-300">
            <p>{t('home.feishu.statusProcessing', 'Processing your request to Feishu Base... Please wait.')}</p>
          </div>
        )}
        {feishuSuccessMessage && (
          <div className="my-6 p-4 text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900 dark:bg-opacity-50 border border-green-300 dark:border-green-700 rounded-lg shadow-lg transition-colors duration-300">
            <p>{feishuSuccessMessage}</p> {/* Already internationalized from the hook */}
          </div>
        )}
        {feishuErrorMessage && (
          <div className="my-6 p-4 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 dark:bg-opacity-50 border border-red-300 dark:border-red-700 rounded-lg shadow-lg transition-colors duration-300">
            <p>{t('home.feishu.errorPrefix', 'Feishu Error:')} {feishuErrorMessage}</p> {/* Already internationalized from the hook */}
          </div>
        )}

        {parsedFeatures.length > 0 && !isCreatingTable && (
          <div className="mt-10 bg-gray-50 dark:bg-slate-800 shadow-xl dark:shadow-2xl rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
             <div className="p-6">
              <h2 className="text-2xl font-semibold mb-1 text-blue-600 dark:text-blue-300">{t('home.processedFeatures.title', 'Processed Features Data')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-700 transition-colors duration-300">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-100 dark:bg-slate-700 z-10 transition-colors duration-300">{t('home.processedFeatures.table.id', 'ID')}</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sticky left-[calc(theme(spacing.12)+1px)] xl:left-[calc(theme(spacing.16)+1px)] bg-gray-100 dark:bg-slate-700 z-10 min-w-[60px] transition-colors duration-300">{t('home.processedFeatures.table.geometry', 'Geometry')}</th>
                    {memoizedPropertyKeys.map(key => {
                      const fieldDef = fieldDefinitions.find(f => f.name === key);
                      return (
                        <th key={key} className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {fieldDef ? fieldDef.alias : key} 
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 transition-colors duration-300">
                  {parsedFeatures.map((feature: ParsedFeature, index: number) => (
                    <tr key={feature.id} 
                        className={`hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors duration-150 group 
                                    ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'}`}>
                      <td className={`px-5 py-3 whitespace-nowrap sticky left-0 z-0 font-mono text-xs text-gray-700 dark:text-gray-300 
                                    group-hover:bg-gray-100 dark:group-hover:bg-slate-700/50 
                                    ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'} 
                                    transition-colors duration-150`}>{feature.id}</td>
                      <td 
                        className={`px-5 py-3 whitespace-nowrap sticky left-[calc(theme(spacing.12)+1px)] xl:left-[calc(theme(spacing.16)+1px)] z-0 
                                    flex items-center justify-center cursor-pointer 
                                    group-hover:bg-gray-100 dark:group-hover:bg-slate-700/50 
                                    ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'} 
                                    transition-colors duration-150`}
                        onClick={() => openGeometryModal(feature.wkt, t('home.modal.titleWithId', 'Feature ID: {{id}}', {id: feature.id}))}
                        title={t('home.modal.clickViewLarger', 'Click to view larger')}
                      >
                        <WktPreview wktString={feature.wkt} size={36} />
                      </td>
                      {memoizedPropertyKeys.map(key => (
                        <td key={`${feature.id}-${key}`} className="px-5 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {feature.properties && feature.properties[key] !== undefined ? 
                            (typeof feature.properties[key] === 'object' ? JSON.stringify(feature.properties[key]) : String(feature.properties[key])) 
                            : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <GeometryModal 
        isOpen={isModalOpen} 
        onClose={closeGeometryModal} 
        wktString={modalWktString} 
        title={modalTitle} 
        t={t} // Pass t to modal, modal will also need theme updates
      />
    </div>
  )
}

export default Home
