
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ClothingItem, UserProfile, ColorInfo } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const clothingItemSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, description: "e.g., 'T-Shirt', 'Jeans', 'Sneakers'" },
        color: { type: Type.STRING, description: "The dominant color of the item." },
        pattern: { type: Type.STRING, description: "e.g., 'solid', 'striped', 'floral'" },
        style: { type: Type.STRING, description: "e.g., 'casual', 'formal', 'sporty'" },
    },
    required: ["type", "color", "pattern", "style"],
};

export const analyzeClothingItem = async (imageFile: File): Promise<Omit<ClothingItem, 'id' | 'imageUrl' | 'status'>> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: "Analyze this clothing item and describe it. Provide a concise, one-word name for the item type." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: clothingItemSchema,
        },
    });

    const result = JSON.parse(response.text);
    return { name: result.type, ...result };
};


export const analyzeSkinTone = async (imageFile: File): Promise<{ skinTone: string, colorPalette: ColorInfo[] }> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const skinToneSchema = {
        type: Type.OBJECT,
        properties: {
            skinTone: { type: Type.STRING, description: "A description of the skin tone, e.g., 'Fair with cool undertones'." },
            colorPalette: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The name of the color." },
                        hex: { type: Type.STRING, description: "The hex code for the color, e.g., '#RRGGBB'." }
                    },
                    required: ["name", "hex"]
                },
                description: "An array of 5 color objects (name and hex code) that would flatter this skin tone."
            }
        },
        required: ["skinTone", "colorPalette"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: "Analyze the skin tone of the person in this image. Suggest a flattering color palette of 5 colors. For each color, provide its name and hex code." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: skinToneSchema,
        },
    });

    return JSON.parse(response.text);
};

export const generateOutfit = async (wardrobe: ClothingItem[], profile: UserProfile, occasion: string): Promise<{outfit: Record<string, string>, justification: string}> => {
    const availableItems = wardrobe.filter(item => item.status === 'available');
    if (availableItems.length < 2) {
        throw new Error("Not enough available items in wardrobe to create an outfit.");
    }
    const prompt = `
        You are a fashion stylist. Based on the user's profile and available wardrobe, create an outfit for a '${occasion}' occasion.
        User Profile: ${JSON.stringify(profile)}
        Available Wardrobe: ${JSON.stringify(availableItems.map(i => ({ type: i.type, color: i.color, style: i.style, name: i.name })))}
        
        Suggest one top, one bottom, and optionally shoes or an accessory. The outfit should be stylish and coherent.
        Provide your response in JSON format.
    `;
    
    const outfitSchema = {
        type: Type.OBJECT,
        properties: {
            outfit: {
                type: Type.OBJECT,
                properties: {
                    top: { type: Type.STRING, description: "The name of the top item from the wardrobe." },
                    bottom: { type: Type.STRING, description: "The name of the bottom item from the wardrobe." },
                    shoes: { type: Type.STRING, description: "The name of the shoes item from the wardrobe (optional)." },
                    accessory: { type: Type.STRING, description: "The name of the accessory item from the wardrobe (optional)." },
                },
                 required: ["top", "bottom"],
            },
            justification: { type: Type.STRING, description: "A brief explanation of why this outfit works." },
        },
        required: ["outfit", "justification"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: outfitSchema,
        }
    });

    return JSON.parse(response.text);
};


interface ClothingFiles {
    upper?: File | null;
    lower?: File | null;
    accessory?: File | null;
}

export const performVirtualTryOn = async (personFile: File, clothingFiles: ClothingFiles): Promise<string> => {
    const personPart = await fileToGenerativePart(personFile);
    // FIX: Explicitly type the `parts` array to allow both image and text parts.
    // TypeScript was inferring the type from `personPart` only, causing an error
    // when trying to push a text part later.
    const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string; })[] = [personPart];
    const clothingInstructions: string[] = [];

    if (clothingFiles.upper) {
        const upperPart = await fileToGenerativePart(clothingFiles.upper);
        parts.push(upperPart);
        clothingInstructions.push("wear the upper body clothing, replacing their current top");
    }
    if (clothingFiles.lower) {
        const lowerPart = await fileToGenerativePart(clothingFiles.lower);
        parts.push(lowerPart);
        clothingInstructions.push("wear the lower body clothing, replacing their current bottoms");
    }
    if (clothingFiles.accessory) {
        const accessoryPart = await fileToGenerativePart(clothingFiles.accessory);
        parts.push(accessoryPart);
        clothingInstructions.push("wear the accessory");
    }

    const promptText = `Edit the first image of the person to make them ${clothingInstructions.join(' and ')}. Maintain the original background and person's pose.`;
    parts.push({ text: promptText });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts,
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
    }

    throw new Error("Could not generate try-on image.");
};


export const getFashionTrends = async (region: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `What are the top 5 current fashion trends for this season in ${region}? Provide a concise summary.`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return response.text;
};


export const getShoppingSuggestions = async (itemDescription: string, wardrobe: ClothingItem[], profile: UserProfile): Promise<string> => {
    const prompt = `
        A user is thinking about buying: "${itemDescription}".
        Based on their existing wardrobe and style profile, is this a good purchase? 
        How would it pair with items they already own? Suggest 2-3 outfit combinations.
        User Profile: ${JSON.stringify(profile)}
        Existing Wardrobe: ${JSON.stringify(wardrobe.map(i => ({ type: i.type, color: i.color, style: i.style })))}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text;
};
