import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyzes an image using Gemini Vision API
 * @param imageData - Base64 encoded image data or buffer
 * @param mimeType - MIME type of the image
 * @param prompt - Optional custom prompt for analysis
 * @returns Summary/description of the image
 */
export async function analyzeImage(
  imageData: Buffer,
  mimeType: string,
  prompt?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePart = {
      inlineData: {
        data: imageData.toString('base64'),
        mimeType: mimeType,
      },
    };

    const defaultPrompt = prompt || 'Analyze this image and provide a detailed description of what you see.';

    const result = await model.generateContent([defaultPrompt, imagePart]);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    logger.error('Error analyzing image with Gemini', error);
    throw new Error('Failed to analyze image');
  }
}

/**
 * Analyzes a document using Gemini
 * @param documentData - Buffer containing document data
 * @param mimeType - MIME type of the document
 * @param filename - Name of the document file
 * @returns Summary of the document
 */
export async function analyzeDocument(
  documentData: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const documentPart = {
      inlineData: {
        data: documentData.toString('base64'),
        mimeType: mimeType,
      },
    };

    const prompt = `Analyze this document (${filename}) and provide a comprehensive summary including:
1. Main topic and purpose
2. Key points and findings
3. Important details or data
4. Overall conclusion`;

    const result = await model.generateContent([prompt, documentPart]);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    logger.error('Error analyzing document with Gemini', error, { filename });
    throw new Error('Failed to analyze document');
  }
}

/**
 * Transcribes and analyzes audio using Gemini
 * @param audioData - Buffer containing audio data
 * @param mimeType - MIME type of the audio
 * @returns Transcription and summary of the audio
 */
export async function analyzeAudio(
  audioData: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const audioPart = {
      inlineData: {
        data: audioData.toString('base64'),
        mimeType: mimeType,
      },
    };

    const prompt = `Transcribe and analyze this audio. Provide:
1. Complete transcription of the speech
2. Summary of main points
3. Sentiment or tone of the message`;

    const result = await model.generateContent([prompt, audioPart]);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    logger.error('Error analyzing audio with Gemini', error);
    throw new Error('Failed to analyze audio');
  }
}

/**
 * Processes text messages using Gemini
 * @param text - User's text message
 * @returns AI-generated response
 */
export async function processTextMessage(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(text);
    const response = result.response;
    const responseText = response.text();

    return responseText;
  } catch (error) {
    logger.error('Error processing text with Gemini', error);
    throw new Error('Failed to process text message');
  }
}
