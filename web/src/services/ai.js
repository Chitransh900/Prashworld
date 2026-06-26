import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `You are Prashworld AI, a helpful, friendly, and cool AI assistant built into the Prashworld social network. 
Prashworld is a social network for nature lovers and adventurers. Keep your answers concise, fun, and use emojis!`;

export const generateAIResponse = async (prompt) => {
  try {
    if (!API_KEY) throw new Error("Gemini API key is missing");
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${prompt}\nAI:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "Oops! I encountered an error. Please try again later. 🍃";
  }
};

/* ============================================
   SMART GALLERY — IMAGE ANALYSIS
   ============================================ */

const GALLERY_ANALYSIS_PROMPT = `Analyze this image in detail. Return your response ONLY as valid JSON with no extra text, no markdown fences. Use this exact structure:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "description": "A single descriptive sentence about the image.",
  "dominantColors": ["color1", "color2", "color3"],
  "mood": "the overall mood or feeling of the image",
  "category": "one of: nature, animal, landscape, portrait, food, architecture, travel, art, other"
}

Rules:
- Tags should be highly descriptive, specific, and lowercase (e.g., "golden sunset", "mountain lake", "red fox").
- Provide exactly 10 tags.
- The description should be vivid and concise (max 20 words).
- dominantColors should be simple color names.
- mood should be a single word or short phrase.
- category should be one of the listed options.`;

/**
 * Convert a File object to a base64 data part for the Gemini API
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyze an image using Gemini Vision and return structured tags + metadata.
 * @param {File} imageFile - The image file to analyze
 * @returns {Promise<{tags: string[], description: string, dominantColors: string[], mood: string, category: string}>}
 */
export const analyzeImageForTags = async (imageFile) => {
  try {
    if (!API_KEY) throw new Error("Gemini API key is missing");

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const imagePart = await fileToGenerativePart(imageFile);

    const result = await model.generateContent([GALLERY_ANALYSIS_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response, stripping any accidental markdown fences
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      tags: parsed.tags || [],
      description: parsed.description || 'No description available.',
      dominantColors: parsed.dominantColors || [],
      mood: parsed.mood || 'unknown',
      category: parsed.category || 'other',
    };
  } catch (error) {
    console.error("Gallery AI Analysis Error:", error);
    // Return fallback data so the upload can still proceed
    return {
      tags: ['uploaded', 'image'],
      description: 'Image uploaded to gallery.',
      dominantColors: [],
      mood: 'unknown',
      category: 'other',
    };
  }
};

/**
 * Perform a natural language search against gallery image metadata.
 * Uses Gemini to extract search intent and match keywords.
 * @param {string} query - The user's natural language search query
 * @returns {Promise<string[]>} - Array of search keywords to match against tags
 */
export const extractSearchKeywords = async (query) => {
  try {
    if (!API_KEY) throw new Error("Gemini API key is missing");

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Given this search query for an image gallery: "${query}"

Extract the key visual concepts the user is looking for. Return ONLY a JSON array of lowercase keywords that would match image tags.
Example: "photos of my dog at the beach" → ["dog", "beach", "sand", "ocean", "pet", "water"]
Example: "sunset pictures" → ["sunset", "golden hour", "orange sky", "evening", "dusk"]

Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Search keyword extraction error:", error);
    // Fallback: split the query into simple words
    return query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  }
};
