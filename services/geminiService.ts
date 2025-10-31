import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageState } from '../types';

export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const fullPrompt = `${prompt.trim()}. The final generated image should have an aspect ratio of ${aspectRatio}.`;

  const textPart = {
    text: fullPrompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image found in the API response.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Enhance error message for common issues
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("Invalid API Key. Please check your configuration.");
    }
    throw new Error("Failed to generate image from the API.");
  }
};


export const performVirtualTryOn = async (
  modelImage: ImageState,
  productImage: ImageState,
  backgroundImage: ImageState | null,
  aspectRatio: string,
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts = [];

  const modelImagePart = {
    inlineData: { data: modelImage.data, mimeType: modelImage.mimeType, },
  };
  const productImagePart = {
    inlineData: { data: productImage.data, mimeType: productImage.mimeType, },
  };
  
  parts.push(modelImagePart, productImagePart);

  let promptText = `Task: Virtual Try-On.
Image 1 is a model. Image 2 is a clothing product.
Your goal is to generate a new image showing the model from Image 1 wearing the product from Image 2.
- CRITICAL: Do NOT change the model's pose, face, hair, or body. Preserve them exactly.
- Fit the clothing product onto the model realistically.`;

  if (backgroundImage) {
    const backgroundImagePart = {
      inlineData: { data: backgroundImage.data, mimeType: backgroundImage.mimeType, },
    };
    parts.push(backgroundImagePart);
    promptText += `
- Image 3 is the new background. Place the model (now wearing the new clothes) onto this background. The final image must use this background.`
  } else {
    promptText += `
- Keep the original background from the model's image (Image 1).`
  }

  promptText += `
- The final generated image must have an aspect ratio of ${aspectRatio}.`;

  const textPart = { text: promptText };
  parts.unshift(textPart); // Prepend text part

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image found in the API response.");
  } catch (error) {
    console.error("Error calling Gemini API for Virtual Try-On:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("Invalid API Key. Please check your configuration.");
    }
    throw new Error("Failed to generate virtual try-on image from the API.");
  }
};

export const changeImageColor = async (
  productImage: ImageState,
  color: string,
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = {
    inlineData: { data: productImage.data, mimeType: productImage.mimeType },
  };
  
  const textPart = { 
    text: `Change the color of the clothing item in the image to ${color}. IMPORTANT: Do not change the shape, texture, or any other aspect of the image. Only change the color.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image found in the API response.");
  } catch (error) {
    console.error(`Error calling Gemini API for color change to ${color}:`, error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("Invalid API Key. Please check your configuration.");
    }
    throw new Error("Failed to generate color-adjusted image from the API.");
  }
};