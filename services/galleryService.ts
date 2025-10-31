import type { ImageState } from '../types';
import { initDB, GALLERY_STORE_NAME } from './db';

/**
 * Retrieves the list of saved images from IndexedDB.
 * @returns {Promise<ImageState[]>} A promise that resolves to an array of stored images.
 */
export const getSavedImages = async (): Promise<ImageState[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Error fetching saved images:', request.error);
      reject('Error fetching saved images');
    };

    request.onsuccess = () => {
      // Sort by ID descending to show newest first
      const sortedResult = request.result.sort((a, b) => b.id - a.id);
      resolve(sortedResult);
    };
  });
};

/**
 * Adds a new image to the gallery in IndexedDB.
 * @param {Omit<ImageState, 'id'>} newImageData The image data for the new image.
 * @returns {Promise<ImageState>} A promise that resolves to the newly saved image.
 */
export const saveImage = async (newImageData: Omit<ImageState, 'id'>): Promise<ImageState> => {
  const db = await initDB();
  const imageWithId: ImageState = { ...newImageData, id: Date.now() };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    const request = store.add(imageWithId);

    request.onerror = () => {
      console.error('Error saving image:', request.error);
      reject('Error saving image');
    };

    request.onsuccess = () => {
      resolve(imageWithId);
    };
  });
};

/**
 * Deletes an image from the gallery by its ID in IndexedDB.
 * @param {number} id The ID of the image to delete.
 * @returns {Promise<void>} A promise that resolves when the image is deleted.
 */
export const deleteSavedImage = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Error deleting image:', request.error);
      reject('Error deleting image');
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};
