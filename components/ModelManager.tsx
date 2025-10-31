import React, { useState, useEffect } from 'react';
import { getModels, addModel, deleteModel } from '../services/modelLibraryService';
import type { ImageState } from '../types';
import { ImageUploader } from './ImageUploader';

export const ModelManager: React.FC = () => {
    const [models, setModels] = useState<ImageState[]>([]);
    
    const refreshModels = async () => {
        try {
            const fetchedModels = await getModels();
            setModels(fetchedModels);
        } catch (e) {
            console.error("Failed to refresh models:", e);
        }
    };

    useEffect(() => {
        refreshModels();
    }, []);

    const handleImageUpload = async (imageState: Omit<ImageState, 'id'>) => {
        await addModel(imageState);
        await refreshModels();
    };
    
    const handleDelete = async (id: number) => {
        await deleteModel(id);
        await refreshModels();
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-1 text-gray-200">Add New Model</h3>
                <p className="text-sm text-gray-400 mb-4">Upload a clear, full-body photo of a new model to add to your library.</p>
                <ImageUploader onImageUpload={handleImageUpload} />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Your Saved Models</h3>
                {models.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {models.map(model => (
                            <div key={model.id} className="relative group">
                                <img 
                                    src={model.dataUrl} 
                                    alt={`Model ${model.id}`} 
                                    className="aspect-w-1 aspect-h-1 w-full rounded-lg object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                                     <button 
                                        onClick={() => handleDelete(model.id)}
                                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 hover:bg-red-700 rounded-full"
                                        aria-label="Delete model"
                                        title="Delete model"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <p className="text-gray-400">Your model library is empty.</p>
                        <p className="text-sm text-gray-500 mt-1">Upload a model above to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
