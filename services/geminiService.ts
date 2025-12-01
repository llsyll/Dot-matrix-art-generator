import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: API_KEY is handled via process.env.API_KEY or user input in a real app context if needed.
// Here we assume environment variable or prompt. Since we can't prompt easily without UI, 
// we will assume the environment variable is present or handle the error gracefully.
const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateAIImage = async (prompt: string): Promise<string> => {
    try {
        const client = getClient();
        
        // Enhance prompt for dot-matrix/thermal suitability
        const enhancedPrompt = `High contrast, black and white line art or stipple illustration of ${prompt}. Vector graphic style, clean lines, white background. Minimalist. Suitable for thermal printing.`;

        // Use a model capable of image generation. 
        // Based on instructions: gemini-3-pro-image-preview for high quality or gemini-2.5-flash-image.
        // Let's use gemini-2.5-flash-image for speed as requested by "fast" default, 
        // but switch to pro if complexity is implied. Let's default to flash-image for this tool.
        const model = 'gemini-2.5-flash-image'; 

        const response = await client.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: enhancedPrompt }]
            },
            config: {
                 // N.B. imageConfig options like aspectRatio can be added here if needed.
                 // Default is 1:1 which is good for stickers.
            }
        });

        // Parse response
        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("No image data found in response");

    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw error;
    }
};

export const generateLabelText = async (context: string): Promise<string> => {
    try {
        const client = getClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short, witty, industrial-style product label description (max 15 words) for: ${context}. Return ONLY the text.`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini Text Gen Error:", error);
        return "ERROR_GEN_TEXT";
    }
};