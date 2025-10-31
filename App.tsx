import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageDisplay } from './components/ImageDisplay';
import { editImageWithPrompt } from './services/geminiService';
import { initializeDefaultModels } from './services/modelLibraryService';
import { saveImage as saveImageToGallery } from './services/galleryService';
import type { ImageState } from './types';
import { VirtualTryOn } from './components/VirtualTryOn';
import { ModelManager } from './components/ModelManager';
import { Gallery } from './components/Gallery';

const EditorView: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (imageState: Omit<ImageState, 'id'>) => {
    setOriginalImage({ ...imageState, id: Date.now() });
    setEditedImage(null);
    setIsResultSaved(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!originalImage || !prompt.trim()) {
      setError("Please upload an image and enter a prompt.");
      return;
    }

    setIsLoading(true);
    setEditedImage(null);
    setIsResultSaved(false);
    setError(null);

    try {
      const newImageBase64 = await editImageWithPrompt(
        originalImage.data,
        originalImage.mimeType,
        prompt,
        aspectRatio
      );
      setEditedImage(`data:image/png;base64,${newImageBase64}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSave = async () => {
    if (!editedImage) return;

    try {
      // Extract data from data URL
      const mimeType = editedImage.substring(editedImage.indexOf(':') + 1, editedImage.indexOf(';'));
      const base64Data = editedImage.split(',')[1];
      
      await saveImageToGallery({
        data: base64Data,
        mimeType: mimeType,
        dataUrl: editedImage,
      });
      setIsResultSaved(true);
    } catch (e) {
        console.error("Failed to save image:", e);
        setError("Could not save the image. Please try again.");
    }
  };

  const categorizedPrompts = {
    "Photo Cleanup & Retouch": [
      "Remove the person in the background",
      "Clean up smudges and blemishes from the product",
      "Remove wrinkles from the clothing",
      "Fix the harsh lighting to be softer",
    ],
    "Outfit & Style Changes": [
      "Change the shirt color to bright red",
      "Change the dress pattern to polka dots",
      "Make the jacket material look like denim",
      "Add a small logo to the left side of the polo shirt",
    ],
    "Background & Scene": [
      "Change the background to a professional studio setting",
      "Place the model on a busy city street",
      "Give it a warm, vintage film look",
      "Turn this into a futuristic neon-lit scene",
    ]
  };

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column: Original Image */}
      <div className="flex flex-col gap-6">
        {!originalImage ? (
          <ImageUploader onImageUpload={handleImageUpload} />
        ) : (
          <ImageDisplay title="Original" imageDataUrl={originalImage.dataUrl} />
        )}
      </div>

      {/* Right Column: Controls and Edited Image */}
      <div className="flex flex-col gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Editing Instructions
          </label>
          <textarea
            id="prompt"
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="e.g., Change the shirt color to red (Enter to generate, Shift+Enter for new line)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="mt-4 flex flex-col gap-3">
            {Object.entries(categorizedPrompts).map(([category, prompts]) => (
                <div key={category}>
                    <span className="text-sm text-gray-400 self-center block mb-2">{category}</span>
                    <div className="flex flex-wrap gap-2">
                        {prompts.map(p => (
                            <button key={p} onClick={() => setPrompt(p)} disabled={isLoading} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full px-3 py-1 transition-colors duration-200">
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <select
              id="aspect-ratio"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={isLoading}
            >
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="3:4">Tall (3:4)</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !originalImage || !prompt.trim()}
            className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <ImageDisplay 
          title="Edited" 
          imageDataUrl={editedImage} 
          isLoading={isLoading}
          onSave={editedImage && !isResultSaved ? handleSave : undefined}
          isSaved={isResultSaved}
        />
         {originalImage && (
            <button 
              onClick={() => {
                setOriginalImage(null);
                setEditedImage(null);
                setPrompt('');
                setError(null);
                setIsResultSaved(false);
              }} 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Upload a different image
            </button>
          )}
      </div>
    </main>
  )
}


const App: React.FC = () => {
  const [mode, setMode] = useState<'editor' | 'tryOn' | 'library' | 'gallery'>('editor');
  
  useEffect(() => {
    const init = async () => {
      await initializeDefaultModels();
    };
    init().catch(console.error);
  }, []);

  const descriptions = {
    editor: "Upload a photo and use simple text prompts to edit it with the power of Gemini.",
    tryOn: "Select a model from your library, then upload a product to create a virtual try-on photoshoot.",
    library: "Manage your reusable model images. Upload new models or delete existing ones.",
    gallery: "Browse, review, and manage all of your saved image creations."
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Image Editor
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            {descriptions[mode]}
          </p>
        </header>

        <div className="flex justify-center border-b border-gray-700 mb-8">
          <button 
            onClick={() => setMode('editor')}
            className={`px-4 py-2 -mb-px text-base sm:text-lg font-medium transition-colors focus:outline-none ${mode === 'editor' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={mode === 'editor'}
          >
            General Editor
          </button>
          <button 
            onClick={() => setMode('tryOn')}
            className={`px-4 py-2 -mb-px text-base sm:text-lg font-medium transition-colors focus:outline-none ${mode === 'tryOn' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={mode === 'tryOn'}
          >
            Virtual Try-On
          </button>
          <button 
            onClick={() => setMode('library')}
            className={`px-4 py-2 -mb-px text-base sm:text-lg font-medium transition-colors focus:outline-none ${mode === 'library' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={mode === 'library'}
          >
            Model Library
          </button>
          <button 
            onClick={() => setMode('gallery')}
            className={`px-4 py-2 -mb-px text-base sm:text-lg font-medium transition-colors focus:outline-none ${mode === 'gallery' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={mode === 'gallery'}
          >
            Saved Gallery
          </button>
        </div>
        
        {mode === 'editor' && <EditorView />}
        {mode === 'tryOn' && <VirtualTryOn setMode={setMode} />}
        {mode === 'library' && <ModelManager />}
        {mode === 'gallery' && <Gallery />}

      </div>
    </div>
  );
};

export default App;