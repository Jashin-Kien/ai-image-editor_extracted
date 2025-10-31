export const DB_NAME = 'AIImageEditorDB';
export const MODELS_STORE_NAME = 'models';
export const GALLERY_STORE_NAME = 'savedImages';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create models store if it doesn't exist
      if (!db.objectStoreNames.contains(MODELS_STORE_NAME)) {
        db.createObjectStore(MODELS_STORE_NAME, { keyPath: 'id' });
      }

      // Create savedImages store if it doesn't exist
      if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
        db.createObjectStore(GALLERY_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};
