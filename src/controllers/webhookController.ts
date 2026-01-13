import { Request, Response } from 'express';
import { verifyRequestSignature } from '../utils/security';
import { logger } from '../utils/logger';
import {
  handleTextMessage,
  handleAudioMessage,
  handleImageMessage,
  handleDocumentMessage,
  handleVideoMessage,
} from '../services/messageHandler';
import { sendTextMessage } from '../services/whatsappService';

/**
 * Handles webhook verification from Meta
 * GET /webhook
 */
export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (
      mode === 'subscribe' &&
      token === process.env.WEBHOOK_VERIFICATION_TOKEN
    ) {
      // Respond with 200 OK and challenge token from the request
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      logger.warn('Webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    // Responds with '400 Bad Request' if required parameters are missing
    res.sendStatus(400);
  }
}

/**
 * Handles incoming webhook messages from Meta
 * POST /webhook
 */
export function handleWebhook(req: Request, res: Response): void {
  const body = req.body;

  // Verify that the request is from Meta
  if (!verifyRequestSignature(req)) {
    logger.warn('Unauthorized request', { reason: 'signature_verification_failed' });
    res.sendStatus(401);
    return;
  }

  logger.info('Incoming webhook event', {
    object: body?.object,
    entryCount: Array.isArray(body?.entry) ? body.entry.length : 0,
  });

  // Check if this is an event from a WhatsApp page subscription
  if (body.object === 'whatsapp_business_account') {
    // Iterate over each entry - there may be multiple if batched
    body.entry?.forEach((entry: any) => {
      // Get the webhook event
      const changes = entry.changes;

      changes?.forEach((change: any) => {
        // Get the message value
        const value = change.value;

        if (value.messages) {
          const messages = value.messages;

          messages.forEach(async (message: any) => {
            logger.info('Message received', {
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              type: message.type,
            });

            const from = message.from;
            const messageId = message.id;
            const messageType = message.type;

            try {
              // Route message based on type
              switch (messageType) {
                case 'text':
                  await handleTextMessage(
                    from,
                    messageId,
                    message.text.body
                  );
                  break;

                case 'audio':
                  await handleAudioMessage(
                    from,
                    messageId,
                    message.audio.id,
                    message.audio.mime_type
                  );
                  break;

                case 'image':
                  await handleImageMessage(
                    from,
                    messageId,
                    message.image.id,
                    message.image.caption
                  );
                  break;

                case 'document':
                  await handleDocumentMessage(
                    from,
                    messageId,
                    message.document.id,
                    message.document.filename,
                    message.document.mime_type
                  );
                  break;

                case 'video':
                  await handleVideoMessage(
                    from,
                    messageId,
                    message.video.id,
                    message.video.caption
                  );
                  break;

                default:
                  logger.warn('Unsupported message type', { messageType });
                  const replyText = `Sorry, I cannot process ${messageType} messages yet.`;
                  await sendTextMessage(from, replyText)
              }

              logger.info('Generated reply', { from, messageId, messageType });

              // TODO: Send the reply back to WhatsApp using the Graph API
              // You'll need to implement sendWhatsAppMessage() function
            } catch (error) {
              logger.error('Error processing message', error, {
                from,
                messageId,
                messageType,
              });
            }
          });
        }

        if (value.statuses) {
          logger.info('Message status update', {
            statusCount: Array.isArray(value.statuses) ? value.statuses.length : 0,
          });
        }
      });
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp page
    res.sendStatus(404);
  }
}
