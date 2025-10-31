
import React from 'react';

interface ImageDisplayProps {
  title: string;
  imageDataUrl?: string | null;
  isLoading?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const Placeholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm">Your edited image will appear here</p>
    </div>
);


export const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageDataUrl, isLoading = false, onSave, isSaved = false }) => {
  
  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.href = imageDataUrl;
    // Sanitize title for filename
    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-image.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
      <div className="relative aspect-w-1 aspect-h-1 w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg min-h-[256px] sm:min-h-[320px]">
        {isLoading ? (
          <LoadingSpinner />
        ) : imageDataUrl ? (
          <>
            <img src={imageDataUrl} alt={title} className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 flex gap-2">
              {onSave && (
                 <button
                  onClick={onSave}
                  className={`p-2 bg-gray-900 bg-opacity-60 rounded-full transition-colors ${isSaved ? 'text-pink-500' : 'text-white hover:bg-opacity-80'}`}
                  aria-label={isSaved ? 'Image saved' : 'Save image'}
                  title={isSaved ? 'Image saved' : 'Save image'}
                  disabled={isSaved}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleDownload}
                className="p-2 bg-gray-900 bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity"
                aria-label="Download image"
                title="Download image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};