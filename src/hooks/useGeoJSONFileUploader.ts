import { useState, useCallback } from 'react';

export interface FileUploaderError {
  message: string;
  details?: any;
}

export interface UseGeoJSONFileUploaderReturn {
  selectedFile: File | null;
  fileContent: string | null;
  error: FileUploaderError | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

export const useGeoJSONFileUploader = (): UseGeoJSONFileUploaderReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<FileUploaderError | null>(null);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setFileContent(null);
    setError(null);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    reset(); // Reset previous state on new file selection
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type || 
          (file.type !== 'application/geo+json' && 
           file.type !== 'application/json' && // Allow application/json MIME type
           !file.name.endsWith('.geojson') && 
           !file.name.endsWith('.json') // Allow .json extension
          )
         ) {
        setError({ message: 'Invalid file type. Please upload a .geojson or .json file.' });
        setSelectedFile(null); // Ensure selectedFile is also reset
        // Clear the input value so the user can select the same file again if they wish after an error
        if (event.target) {
            event.target.value = "";
        }
        return;
      }
      
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setFileContent(e.target.result);
          setError(null); // Clear any previous error
        } else {
          setError({ message: 'Failed to read file content.' });
          setFileContent(null); // Ensure fileContent is reset
        }
      };
      reader.onerror = (err) => {
        setError({ message: 'Error reading file.', details: err });
        setFileContent(null); // Ensure fileContent is reset
      };
      reader.readAsText(file);
    } else {
      // setError({ message: 'No file selected or selection was cancelled.'}); // Optional: handle case where no file is selected after all
      reset(); // If no file is selected (e.g., user cancels dialog), reset everything
    }
  }, [reset]);

  return { selectedFile, fileContent, error, handleFileChange, reset };
}; 