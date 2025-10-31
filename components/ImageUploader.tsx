import React, { useState, useCallback } from 'react';
import type { ImageState } from '../types';

interface ImageUploaderProps {
  // FIX: Changed onImageUpload prop to expect Omit<ImageState, 'id'> as the parent component is responsible for assigning the ID.
  onImageUpload: (imageState: Omit<ImageState, 'id'>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        onImageUpload({
          data: base64Data,
          mimeType: file.type,
          dataUrl: dataUrl
        });
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
    }
  }, [onImageUpload]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleUploaderClick = () => {
    document.getElementById('file-upload-input')?.click();
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-64 sm:h-80 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleUploaderClick}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
        <svg className="w-10 h-10 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
        <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 800x600px)</p>
      </div>
      <input id="file-upload-input" type="file" className="hidden" accept="image/*" onChange={handleChange} />
    </div>
  );
};