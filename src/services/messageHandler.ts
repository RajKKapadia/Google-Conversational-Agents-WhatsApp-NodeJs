import {
  analyzeImage,
  analyzeAudio,
  analyzeDocument,
} from './geminiService';
import { downloadMedia, sendTextMessage } from './whatsappService';
import { detectIntent } from './conversationalAgentService';

/**
 * Handles incoming text messages
 * @param from - Sender's phone number
 * @param messageId - Unique message ID
 * @param text - Text content of the message
 * @returns AI-generated response text
 */
export async function handleTextMessage(
  from: string,
  _messageId: string,
  text: string
): Promise<string> {
  console.log(`Processing text message from ${from}: "${text}"`);

  try {
    // Send text directly to Conversational Agent
    const response = await detectIntent(text, from);

    // Send response back to user
    await sendTextMessage(from, response);

    return response;
  } catch (error) {
    console.error('Error processing text message:', error);
    const errorMessage = 'Sorry, I encountered an error processing your message.';
    await sendTextMessage(from, errorMessage);
    return errorMessage;
  }
}

/**
 * Handles incoming audio/voice messages
 * @param from - Sender's phone number
 * @param messageId - Unique message ID
 * @param audioId - WhatsApp media ID for the audio file
 * @param mimeType - Audio MIME type
 * @returns AI-generated response text
 */
export async function handleAudioMessage(
  from: string,
  _messageId: string,
  audioId: string,
  mimeType: string
): Promise<string> {
  console.log(
    `Processing audio message from ${from}, Audio ID: ${audioId}, MIME: ${mimeType}`
  );

  try {
    // Download audio from WhatsApp
    const { data: audioData, mimeType: downloadedMimeType } =
      await downloadMedia(audioId);

    console.log(
      `Downloaded audio: ${audioData.length} bytes, MIME: ${downloadedMimeType}`
    );

    // Analyze audio with Gemini to get transcription/summary
    const geminiAnalysis = await analyzeAudio(audioData, downloadedMimeType);

    console.log(`Gemini audio analysis: ${geminiAnalysis}`);

    // Send the Gemini summary to Conversational Agent for intent detection
    const response = await detectIntent(geminiAnalysis, from);

    // Send response back to user
    await sendTextMessage(from, response);

    return response;
  } catch (error) {
    console.error('Error processing audio message:', error);
    const errorMessage = 'Sorry, I encountered an error processing your audio message.';
    await sendTextMessage(from, errorMessage);
    return errorMessage;
  }
}

/**
 * Handles incoming image messages
 * @param from - Sender's phone number
 * @param messageId - Unique message ID
 * @param imageId - WhatsApp media ID for the image
 * @param caption - Optional image caption
 * @returns AI-generated response text
 */
export async function handleImageMessage(
  from: string,
  _messageId: string,
  imageId: string,
  caption?: string
): Promise<string> {
  console.log(
    `Processing image message from ${from}, Image ID: ${imageId}, Caption: ${caption}`
  );

  try {
    // Download image from WhatsApp
    const { data: imageData, mimeType } = await downloadMedia(imageId);

    console.log(
      `Downloaded image: ${imageData.length} bytes, MIME: ${mimeType}`
    );

    // Create prompt based on caption
    const prompt = caption
      ? `The user sent this image with the caption: "${caption}". Analyze the image and describe what you see.`
      : 'Analyze this image and provide a detailed description of what you see.';

    // Analyze image with Gemini
    const geminiAnalysis = await analyzeImage(imageData, mimeType, prompt);

    console.log(`Gemini image analysis: ${geminiAnalysis}`);

    // Send the Gemini analysis to Conversational Agent for intent detection
    const response = await detectIntent(geminiAnalysis, from);

    // Send response back to user
    await sendTextMessage(from, response);

    return response;
  } catch (error) {
    console.error('Error processing image message:', error);
    const errorMessage = 'Sorry, I encountered an error processing your image.';
    await sendTextMessage(from, errorMessage);
    return errorMessage;
  }
}

/**
 * Handles incoming document messages
 * @param from - Sender's phone number
 * @param messageId - Unique message ID
 * @param documentId - WhatsApp media ID for the document
 * @param filename - Document filename
 * @param mimeType - Document MIME type
 * @returns AI-generated response text
 */
export async function handleDocumentMessage(
  from: string,
  _messageId: string,
  documentId: string,
  filename: string,
  mimeType: string
): Promise<string> {
  console.log(
    `Processing document from ${from}, Doc ID: ${documentId}, Filename: ${filename}, MIME: ${mimeType}`
  );

  try {
    // Download document from WhatsApp
    const { data: documentData, mimeType: downloadedMimeType } =
      await downloadMedia(documentId);

    console.log(
      `Downloaded document: ${documentData.length} bytes, MIME: ${downloadedMimeType}`
    );

    // Analyze document with Gemini
    const geminiSummary = await analyzeDocument(
      documentData,
      downloadedMimeType,
      filename
    );

    console.log(`Gemini document summary: ${geminiSummary}`);

    // Send the Gemini summary to Conversational Agent for intent detection
    const response = await detectIntent(geminiSummary, from);

    // Send response back to user
    await sendTextMessage(from, response);

    return response;
  } catch (error) {
    console.error('Error processing document message:', error);
    const errorMessage = 'Sorry, I encountered an error processing your document.';
    await sendTextMessage(from, errorMessage);
    return errorMessage;
  }
}

/**
 * Handles incoming video messages
 * @param from - Sender's phone number
 * @param messageId - Unique message ID
 * @param videoId - WhatsApp media ID for the video
 * @param caption - Optional video caption
 * @returns AI-generated response text
 */
export async function handleVideoMessage(
  from: string,
  _messageId: string,
  videoId: string,
  caption?: string
): Promise<string> {
  console.log(
    `Processing video message from ${from}, Video ID: ${videoId}, Caption: ${caption}`
  );

  try {
    // Download video from WhatsApp
    const { data: videoData, mimeType } = await downloadMedia(videoId);

    console.log(
      `Downloaded video: ${videoData.length} bytes, MIME: ${mimeType}`
    );

    // Note: Gemini can analyze video files
    // We'll use the same approach as images but with video data
    const prompt = caption
      ? `The user sent this video with the caption: "${caption}". Analyze the video and respond accordingly.`
      : 'Analyze this video and provide a summary of its content.';

    // For video, we can use Gemini's multimodal capabilities
    const videoPart = {
      inlineData: {
        data: videoData.toString('base64'),
        mimeType: mimeType,
      },
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await genModel.generateContent([prompt, videoPart]);
    const geminiAnalysis = result.response.text();

    console.log(`Gemini video analysis: ${geminiAnalysis}`);

    // Send the Gemini analysis to Conversational Agent for intent detection
    const response = await detectIntent(geminiAnalysis, from);

    // Send response back to user
    await sendTextMessage(from, response);

    return response;
  } catch (error) {
    console.error('Error processing video message:', error);
    const errorMessage = 'Sorry, I encountered an error processing your video.';
    await sendTextMessage(from, errorMessage);
    return errorMessage;
  }
}
