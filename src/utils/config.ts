/**
 * Parses the service account JSON from environment variable
 * @returns Parsed service account credentials object
 */
export function getServiceAccountCredentials(): Record<string, any> {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('GCP_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  try {
    // Parse the JSON string from environment variable
    const credentials = JSON.parse(serviceAccountJson);

    // Validate required fields
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error(
        'Invalid service account JSON: missing client_email or private_key'
      );
    }

    return credentials;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        'Invalid JSON in GCP_SERVICE_ACCOUNT_JSON environment variable'
      );
    }
    throw error;
  }
}

/**
 * Gets Conversational Agent configuration from environment
 * @returns Configuration object for Dialogflow CX
 */
export function getConversationalAgentConfig() {
  const projectId = process.env.CA_PROJECT_ID;
  const location = process.env.CA_LOCATION;
  const agentId = process.env.CA_AGENT_ID;

  if (!projectId || !location || !agentId) {
    throw new Error(
      'Missing Conversational Agent configuration. Required: CA_PROJECT_ID, CA_LOCATION, CA_AGENT_ID'
    );
  }

  return {
    projectId,
    location,
    agentId,
  };
}
