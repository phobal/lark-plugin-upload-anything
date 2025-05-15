import React from 'react';
import WktPreview from './WktPreview'; // Assuming WktPreview is in the same directory or adjust path
import { TFunction } from 'i18next'; // Import TFunction

interface GeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wktString: string | null;
  title?: string;
  previewSize?: number;
  t: TFunction; // Add t to props
}

const GeometryModal: React.FC<GeometryModalProps> = ({
  isOpen,
  onClose,
  wktString,
  title, // Default will be handled by t function
  previewSize = 300,
  t, // Destructure t
}) => {
  if (!isOpen || !wktString) {
    return null;
  }

  const modalTitle = title || t('modal.geometryPreview.title', 'Geometry Preview');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close modal on overlay click
    >
      <div 
        // Basic animation can be added via Tailwind classes if needed, e.g., opacity and scale transitions
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl dark:shadow-2xl w-auto max-w-lg border border-gray-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300">{modalTitle}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label={t('modal.geometryPreview.aria.close', 'Close modal')} // Internationalize aria-label
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center items-center p-4 bg-gray-100 dark:bg-slate-700 rounded min-w-[200px] min-h-[200px] sm:min-w-[300px] sm:min-h-[300px] transition-colors duration-300">
          {wktString ? (
            <WktPreview wktString={wktString} size={previewSize} />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{t('modal.geometryPreview.noGeometry', 'No geometry to display.')}</p> // Internationalize text
          )}
        </div>
        <div className="mt-5 text-right">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-75"
            >
                {t('modal.geometryPreview.button.close', 'Close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GeometryModal; 