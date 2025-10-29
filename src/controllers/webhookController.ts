import { Request, Response } from 'express';
import { verifyRequestSignature } from '../utils/security';
import {
  handleTextMessage,
  handleAudioMessage,
  handleImageMessage,
  handleDocumentMessage,
  handleVideoMessage,
} from '../services/messageHandler';

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
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.log('Webhook verification failed!');
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
    console.log('Unauthorized request - signature verification failed');
    res.sendStatus(401);
    return;
  }

  console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

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
            console.log('Message received:', {
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              type: message.type,
            });

            const from = message.from;
            const messageId = message.id;
            const messageType = message.type;

            let replyText: string;

            try {
              // Route message based on type
              switch (messageType) {
                case 'text':
                  replyText = await handleTextMessage(
                    from,
                    messageId,
                    message.text.body
                  );
                  break;

                case 'audio':
                  replyText = await handleAudioMessage(
                    from,
                    messageId,
                    message.audio.id,
                    message.audio.mime_type
                  );
                  break;

                case 'image':
                  replyText = await handleImageMessage(
                    from,
                    messageId,
                    message.image.id,
                    message.image.caption
                  );
                  break;

                case 'document':
                  replyText = await handleDocumentMessage(
                    from,
                    messageId,
                    message.document.id,
                    message.document.filename,
                    message.document.mime_type
                  );
                  break;

                case 'video':
                  replyText = await handleVideoMessage(
                    from,
                    messageId,
                    message.video.id,
                    message.video.caption
                  );
                  break;

                default:
                  console.log(`Unsupported message type: ${messageType}`);
                  replyText = `Sorry, I cannot process ${messageType} messages yet.`;
              }

              console.log(`Generated reply for ${from}: ${replyText}`);

              // TODO: Send the reply back to WhatsApp using the Graph API
              // You'll need to implement sendWhatsAppMessage() function
            } catch (error) {
              console.error('Error processing message:', error);
            }
          });
        }

        if (value.statuses) {
          console.log('Message status update:', value.statuses);
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
