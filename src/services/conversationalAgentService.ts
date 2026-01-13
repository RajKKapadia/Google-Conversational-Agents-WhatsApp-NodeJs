import { SessionsClient } from '@google-cloud/dialogflow-cx';
import {
  getServiceAccountCredentials,
  getConversationalAgentConfig,
} from '../utils/config';
import { logger } from '../utils/logger';

/**
 * Creates a session ID from mobile number
 * @param mobileNumber - User's mobile number
 * @returns Formatted session ID
 */
function createSessionId(mobileNumber: string): string {
  return `meta-whatsapp-${mobileNumber}`;
}

/**
 * Detects intent and gets response from Google Conversational Agent (Dialogflow CX)
 * @param query - Text query to send to the agent
 * @param mobileNumber - User's mobile number (used as session identifier)
 * @returns Agent response text
 */
export async function detectIntent(
  query: string,
  mobileNumber: string
): Promise<string> {
  try {
    // Get service account credentials from environment
    const credentials = getServiceAccountCredentials();

    // Get conversational agent configuration
    const { projectId, location, agentId } = getConversationalAgentConfig();

    // Initialize Dialogflow CX client with credentials
    const client = new SessionsClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    // Create session ID using mobile number
    const sessionId = createSessionId(mobileNumber);

    // Construct session path
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    logger.info('Sending query to Conversational Agent', {
      sessionId,
      sessionPath,
    });

    // Prepare the request
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
        },
        languageCode: 'en',
      },
    };

    // Send request to Dialogflow CX
    const [response] = await client.detectIntent(request);

    logger.info('Received response from Conversational Agent', { sessionId });

    // Extract response messages
    const responseMessages = response.queryResult?.responseMessages || [];

    // Combine all text responses
    const responseText = responseMessages
      .filter((msg) => msg.text?.text && msg.text.text.length > 0)
      .map((msg) => msg.text?.text?.[0])
      .filter((text) => text)
      .join('\n');

    if (!responseText) {
      logger.warn('No text response from agent, using fallback', { sessionId });
      return "I'm sorry, I didn't understand that. Could you please rephrase?";
    }

    // Log detected intent for debugging
    if (response.queryResult?.intent) {
      logger.info('Detected intent', {
        displayName: response.queryResult.intent.displayName,
        confidence: response.queryResult.intentDetectionConfidence,
      });
    }

    return responseText;
  } catch (error) {
    logger.error('Error detecting intent with Conversational Agent', error, {
      sessionId: createSessionId(mobileNumber),
    });
    throw new Error('Failed to get response from Conversational Agent');
  }
}

/**
 * Detects intent with additional parameters
 * @param query - Text query to send to the agent
 * @param mobileNumber - User's mobile number (used as session identifier)
 * @param parameters - Additional parameters to pass to the agent
 * @returns Agent response text
 */
export async function detectIntentWithParameters(
  query: string,
  mobileNumber: string,
  parameters?: Record<string, any>
): Promise<string> {
  try {
    const credentials = getServiceAccountCredentials();
    const { projectId, location, agentId } = getConversationalAgentConfig();

    const client = new SessionsClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    // Create session ID using mobile number
    const sessionId = createSessionId(mobileNumber);

    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    logger.info('Sending query with parameters to Conversational Agent', {
      sessionId,
    });

    const request: any = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
        },
        languageCode: 'en',
      },
    };

    // Add parameters if provided
    if (parameters) {
      request.queryParams = {
        parameters: parameters,
      };
    }

    const [response] = await client.detectIntent(request);

    const responseMessages = response.queryResult?.responseMessages || [];
    const responseText = responseMessages
      .filter((msg) => msg.text?.text && msg.text.text.length > 0)
      .map((msg) => msg.text?.text?.[0])
      .filter((text) => text)
      .join('\n');

    return (
      responseText ||
      "I'm sorry, I didn't understand that. Could you please rephrase?"
    );
  } catch (error) {
    logger.error(
      'Error detecting intent with parameters from Conversational Agent',
      error,
      { sessionId: createSessionId(mobileNumber) }
    );
    throw new Error('Failed to get response from Conversational Agent');
  }
}
