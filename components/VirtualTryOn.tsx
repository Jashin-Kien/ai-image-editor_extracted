import React, { useState, useEffect } from 'react';
import type { ImageState } from '../types';
import { ImageUploader } from './ImageUploader';
import { ImageDisplay } from './ImageDisplay';
import { performVirtualTryOn, changeImageColor } from '../services/geminiService';
import { getModels } from '../services/modelLibraryService';
import { saveImage as saveImageToGallery } from '../services/galleryService';
import { ImageCropper } from './ImageCropper';

interface VirtualTryOnProps {
    setMode: (mode: 'editor' | 'tryOn' | 'library') => void;
}

const clothingColors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray'];

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ setMode }) => {
    const [libraryModels, setLibraryModels] = useState<ImageState[]>([]);
    const [selectedModel, setSelectedModel] = useState<ImageState | null>(null);
    const [productImage, setProductImage] = useState<ImageState | null>(null);
    const [croppedProductImage, setCroppedProductImage] = useState<ImageState | null>(null);
    const [colorAdjustedProductImage, setColorAdjustedProductImage] = useState<ImageState | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<ImageState | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isResultSaved, setIsResultSaved] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isColorizing, setIsColorizing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('9:16');

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const models = await getModels();
                setLibraryModels(models);
            } catch (e) {
                console.error("Failed to load library models:", e);
                setError("Could not load model library.");
            }
        };
        fetchModels();
    }, []);

    const resetState = (level: 'model' | 'product' | 'background') => {
        setError(null);
        setResultImage(null);
        setIsResultSaved(false);
        if (level === 'model') {
            setSelectedModel(null);
            setProductImage(null);
            setCroppedProductImage(null);
            setColorAdjustedProductImage(null);
            setBackgroundImage(null);
        } else if (level === 'product') {
            setProductImage(null);
            setCroppedProductImage(null);
            setColorAdjustedProductImage(null);
            setBackgroundImage(null);
        } else if (level === 'background') {
            setBackgroundImage(null);
        }
    };

    const handleSubmit = async () => {
        const finalProductImage = colorAdjustedProductImage || croppedProductImage;
        if (!selectedModel || !finalProductImage) {
            setError("Please select a model and select a product from the uploaded image.");
            return;
        }
        setIsLoading(true);
        setResultImage(null);
        setIsResultSaved(false);
        setError(null);
        try {
            const newImageBase64 = await performVirtualTryOn(selectedModel, finalProductImage, backgroundImage, aspectRatio);
            setResultImage(`data:image/png;base64,${newImageBase64}`);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
            setError(errorMessage);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (!resultImage) return;
        try {
            const mimeType = resultImage.substring(resultImage.indexOf(':') + 1, resultImage.indexOf(';'));
            const base64Data = resultImage.split(',')[1];
            await saveImageToGallery({
                data: base64Data,
                mimeType: mimeType,
                dataUrl: resultImage,
            });
            setIsResultSaved(true);
        } catch (e) {
            console.error("Failed to save image:", e);
            setError("Could not save the image. Please try again.");
        }
    };

    const handleProductUpload = (image: Omit<ImageState, 'id'>) => {
        setProductImage({ ...image, id: Date.now() });
        setCroppedProductImage(null);
        setColorAdjustedProductImage(null);
    }

    const handleCropComplete = (image: Omit<ImageState, 'id'>) => {
        setCroppedProductImage({ ...image, id: Date.now() + 1 });
        setColorAdjustedProductImage(null); // Reset color on new crop
    };
    
    const handleBackgroundUpload = (image: Omit<ImageState, 'id'>) => {
        setBackgroundImage({ ...image, id: Date.now() });
    }

    const handleColorChange = async (color: string) => {
        if (!croppedProductImage) return;

        setIsColorizing(color);
        setError(null);
        try {
            const newImageBase64 = await changeImageColor(croppedProductImage, color);
            const newImage: ImageState = {
                id: Date.now(),
                data: newImageBase64,
                mimeType: 'image/png',
                dataUrl: `data:image/png;base64,${newImageBase64}`
            };
            setColorAdjustedProductImage(newImage);
        } catch (e) {
            console.error(`Failed to change color to ${color}:`, e);
            setError(`Failed to change color. Please try again.`);
        } finally {
            setIsColorizing(null);
        }
    };

    const displayedProductImage = colorAdjustedProductImage || croppedProductImage;

    return (
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="flex flex-col gap-6">
                {/* Step 1 */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-1 text-gray-200">Step 1: Choose Model</h3>
                    <p className="text-sm text-gray-400 mb-4">Select a model from your library.</p>
                    {libraryModels.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {libraryModels.map(model => (
                                <button key={model.id} onClick={() => setSelectedModel(model)} className={`relative rounded-lg overflow-hidden focus:outline-none focus:ring-4 transition-all ${selectedModel?.id === model.id ? 'ring-purple-500 ring-offset-2 ring-offset-gray-800' : 'ring-transparent'}`}>
                                    <img src={model.dataUrl} alt={`Model ${model.id}`} className="aspect-square w-full object-cover" />
                                    {selectedModel?.id === model.id && (
                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-600 rounded-lg">
                            <p className="text-gray-400">Your model library is empty.</p>
                            <button onClick={() => setMode('library')} className="mt-2 text-purple-400 hover:text-purple-300 font-semibold">
                                Go to Model Library to add models
                            </button>
                        </div>
                    )}
                </div>

                {/* Step 2 */}
                {selectedModel && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-1 text-gray-200">Step 2: Select Product</h3>
                        <p className="text-sm text-gray-400 mb-4">Upload a photo, then click and drag on the image to select the clothing item.</p>
                        
                        {!productImage ? (
                            <ImageUploader onImageUpload={handleProductUpload} />
                        ) : !croppedProductImage ? (
                            <ImageCropper 
                                imageUrl={productImage.dataUrl} 
                                onCropComplete={handleCropComplete}
                                onCancel={() => resetState('product')}
                            />
                        ) : (
                             <div className="relative">
                                <ImageDisplay title="Selected Product" imageDataUrl={displayedProductImage?.dataUrl} isLoading={!!isColorizing} />
                                <div className="absolute top-2 right-2 flex flex-col gap-2">
                                    <button onClick={() => setCroppedProductImage(null)} className="text-xs bg-gray-900 bg-opacity-70 text-white rounded-full px-3 py-1 hover:bg-opacity-90 transition-all">
                                        Re-select
                                    </button>
                                    <button onClick={() => resetState('product')} className="text-xs bg-gray-900 bg-opacity-70 text-white rounded-full px-3 py-1 hover:bg-opacity-90 transition-all">
                                        Change Image
                                    </button>
                                </div>
                            </div>
                        )}
                        {croppedProductImage && (
                             <div className="mt-4">
                                <h4 className="text-md font-semibold mb-1 text-gray-300">Adjust Color</h4>
                                <p className="text-xs text-gray-400 mb-3">Optionally, change the color of the clothing item before the try-on.</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setColorAdjustedProductImage(null)} disabled={!!isColorizing} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full px-3 py-1 transition-colors duration-200">
                                        Original
                                    </button>
                                    {clothingColors.map(color => (
                                        <button key={color} onClick={() => handleColorChange(color)} disabled={!!isColorizing} className={`text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full px-3 py-1 transition-colors duration-200 ${isColorizing === color ? 'animate-pulse' : ''}`}>
                                            {isColorizing === color ? `...` : color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Step 3 */}
                {selectedModel && displayedProductImage && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-1 text-gray-200">Step 3: Upload Background (Optional)</h3>
                        <p className="text-sm text-gray-400 mb-4">Upload a background. If skipped, the model's original background is used.</p>
                        {!backgroundImage ? (
                            <ImageUploader onImageUpload={handleBackgroundUpload} />
                        ) : (
                            <div className="relative">
                                <ImageDisplay title="Your Background" imageDataUrl={backgroundImage.dataUrl} />
                                <button onClick={() => resetState('background')} className="absolute top-4 right-4 text-sm bg-gray-900 bg-opacity-70 text-white rounded-full px-3 py-1 hover:bg-opacity-90 transition-all">Change</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Column: Output & Controls */}
            <div className="flex flex-col gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex flex-col">
                    <ImageDisplay 
                      title="Result" 
                      imageDataUrl={resultImage} 
                      isLoading={isLoading}
                      onSave={resultImage && !isResultSaved ? handleSave : undefined}
                      isSaved={isResultSaved}
                    />
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="mb-4">
                        <label htmlFor="vto-aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">
                            Output Aspect Ratio
                        </label>
                        <select
                            id="vto-aspect-ratio"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            disabled={isLoading}
                        >
                            <option value="9:16">Portrait (9:16)</option>
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="3:4">Tall (3:4)</option>
                            <option value="4:3">Standard (4:3)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !!isColorizing || !selectedModel || !displayedProductImage}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isLoading ? 'Generating...' : (isColorizing ? 'Colorizing...' : 'Generate Try-On')}
                    </button>
                    
                    {error && (
                      <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                      </div>
                    )}
                </div>
            </div>
        </main>
    );
};