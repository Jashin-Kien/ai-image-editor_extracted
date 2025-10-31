
export interface ImageState {
  id: number;
  data: string;      // Raw base64 data for the API
  mimeType: string;  // e.g., 'image/jpeg'
  dataUrl: string;   // Full data URL for <img> src
}
