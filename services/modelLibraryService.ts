import type { ImageState } from '../types';
import { modelsData } from '../components/modelsData';
import { initDB, MODELS_STORE_NAME } from './db';

/**
 * Retrieves the list of models from IndexedDB.
 * @returns {Promise<ImageState[]>} A promise that resolves to an array of stored models.
 */
export const getModels = async (): Promise<ImageState[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(MODELS_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Error fetching models:', request.error);
      reject('Error fetching models');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

/**
 * Adds a new model to the library in IndexedDB.
 * @param {Omit<ImageState, 'id'>} newModelData The image data for the new model.
 * @returns {Promise<ImageState>} A promise that resolves to the newly created model.
 */
export const addModel = async (newModelData: Omit<ImageState, 'id'>): Promise<ImageState> => {
  const db = await initDB();
  const modelWithId: ImageState = { ...newModelData, id: Date.now() };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(MODELS_STORE_NAME);
    const request = store.add(modelWithId);

    request.onerror = () => {
      console.error('Error adding model:', request.error);
      reject('Error adding model');
    };

    request.onsuccess = () => {
      resolve(modelWithId);
    };
  });
};

/**
 * Deletes a model from the library by its ID in IndexedDB.
 * @param {number} id The ID of the model to delete.
 * @returns {Promise<void>} A promise that resolves when the model is deleted.
 */
export const deleteModel = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(MODELS_STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Error deleting model:', request.error);
      reject('Error deleting model');
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

/**
 * Initializes the library with default models if it's currently empty.
 */
export const initializeDefaultModels = async (): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(MODELS_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(MODELS_STORE_NAME);
  const countRequest = store.count();

  countRequest.onsuccess = () => {
    if (countRequest.result === 0) {
      // Library is empty, add default models
      modelsData.forEach(model => {
        store.add(model).onerror = (e) => console.error("Error adding default model:", e);
      });
    }
  };
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Transaction error during initialization");
  });
};
