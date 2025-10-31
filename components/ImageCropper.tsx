import React, { useState, useRef, useCallback } from 'react';
import type { ImageState } from '../types';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (imageState: Omit<ImageState, 'id'>) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCropComplete, onCancel }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (coords) {
      setIsCropping(true);
      setStartPoint(coords);
      setCrop({ ...coords, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCropping || !startPoint) return;
    const coords = getCoords(e);
    if (coords) {
      const newCrop = {
        x: Math.min(startPoint.x, coords.x),
        y: Math.min(startPoint.y, coords.y),
        width: Math.abs(coords.x - startPoint.x),
        height: Math.abs(coords.y - startPoint.y),
      };
      setCrop(newCrop);
    }
  };

  const handleMouseUp = () => {
    setIsCropping(false);
    setStartPoint(null);
  };
  
  const performCrop = useCallback(() => {
    if (!imageRef.current || !crop || crop.width === 0 || crop.height === 0) return;
    
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            onCropComplete({
                data: base64Data,
                mimeType: blob.type,
                dataUrl: dataUrl,
            });
        };
    }, 'image/png');

  }, [crop, onCropComplete]);


  return (
    <div className="flex flex-col gap-4 items-center">
      <div
        ref={containerRef}
        className="relative select-none touch-none cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img ref={imageRef} src={imageUrl} alt="Product to crop" className="max-w-full max-h-[400px] pointer-events-none rounded-lg" />
        {crop && crop.width > 0 && (
          <div
            className="absolute border-2 border-purple-500 bg-purple-500 bg-opacity-30 pointer-events-none"
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.width}px`,
              height: `${crop.height}px`,
            }}
          />
        )}
      </div>
      <div className="flex gap-4">
         <button
            onClick={onCancel}
            className="px-4 py-2 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={performCrop}
            disabled={!crop || crop.width < 10 || crop.height < 10}
            className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Confirm Selection
          </button>
      </div>
    </div>
  );
};
