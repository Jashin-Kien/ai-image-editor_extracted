import React, { useState, useEffect } from 'react';
import { getSavedImages, deleteSavedImage } from '../services/galleryService';
import type { ImageState } from '../types';

export const Gallery: React.FC = () => {
    const [images, setImages] = useState<ImageState[]>([]);
    
    const refreshImages = async () => {
        try {
            const fetchedImages = await getSavedImages();
            setImages(fetchedImages);
        } catch (e) {
            console.error("Failed to refresh saved images:", e);
        }
    };

    useEffect(() => {
        refreshImages();
    }, []);
    
    const handleDelete = async (id: number) => {
        await deleteSavedImage(id);
        await refreshImages();
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Your Saved Creations</h3>
                {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map(image => (
                            <div key={image.id} className="relative group">
                                <img 
                                    src={image.dataUrl} 
                                    alt={`Saved image ${image.id}`} 
                                    className="aspect-w-1 aspect-h-1 w-full rounded-lg object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                                     <button 
                                        onClick={() => handleDelete(image.id)}
                                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 hover:bg-red-700 rounded-full"
                                        aria-label="Delete image"
                                        title="Delete image"
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
                    <div className="text-center py-16 px-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-gray-400 font-semibold">Your saved images will appear here.</p>
                        <p className="text-sm text-gray-500 mt-1">Go create something amazing in the editor!</p>
                    </div>
                )}
            </div>
        </div>
    );
};