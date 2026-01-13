import axios from 'axios';
import { logger } from '../utils/logger';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Downloads media from WhatsApp using the media ID
 * @param mediaId - WhatsApp media ID
 * @returns Buffer containing the media data and MIME type
 */
export async function downloadMedia(
  mediaId: string
): Promise<{ data: Buffer; mimeType: string }> {
  try {
    const accessToken = process.env.ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('ACCESS_TOKEN not configured');
    }

    // Step 1: Get media URL
    const mediaUrlResponse = await axios.get(
      `${WHATSAPP_API_URL}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const mediaUrl = mediaUrlResponse.data.url;
    const mimeType = mediaUrlResponse.data.mime_type;

    // Step 2: Download the actual media file
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'arraybuffer',
    });

    const data = Buffer.from(mediaResponse.data);

    return { data, mimeType };
  } catch (error) {
    logger.error('Error downloading media from WhatsApp', error, { mediaId });
    throw new Error('Failed to download media');
  }
}

/**
 * Sends a text message via WhatsApp
 * @param to - Recipient's phone number
 * @param message - Text message to send
 */
export async function sendTextMessage(
  to: string,
  message: string
): Promise<void> {
  try {
    const accessToken = process.env.ACCESS_TOKEN;
    const phoneId = process.env.PHONE_ID;

    if (!accessToken || !phoneId) {
      throw new Error('ACCESS_TOKEN or PHONE_ID not configured');
    }

    await axios.post(
      `${WHATSAPP_API_URL}/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('Message sent to WhatsApp', { to });
  } catch (error) {
    logger.error('Error sending message via WhatsApp', error, { to });
    throw new Error('Failed to send message');
  }
}
