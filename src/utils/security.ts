import crypto from 'crypto';
import { Request } from 'express';
import { logger } from './logger';

/**
 * Verifies that the webhook request is from Meta using HMAC SHA-256 signature
 * @param req - Express request object
 * @returns boolean indicating if signature is valid
 */
export function verifyRequestSignature(req: Request): boolean {
  const signatureHeader = req.headers['x-hub-signature-256'];
  const signature =
    typeof signatureHeader === 'string' ? signatureHeader : undefined;

  if (!signature) {
    logger.warn('No signature found in request headers');
    return false;
  }

  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    logger.warn('APP_SECRET not configured');
    return false;
  }

  if (!signature.startsWith('sha256=')) {
    logger.warn('Invalid signature format');
    return false;
  }

  // Extract the signature hash (remove 'sha256=' prefix)
  const signatureHash = signature.slice('sha256='.length);
  if (!signatureHash) {
    logger.warn('Signature hash missing from header');
    return false;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const payload = rawBody ?? Buffer.from(JSON.stringify(req.body));

  // Calculate expected signature
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  const signatureBuffer = Buffer.from(signatureHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    logger.warn('Signature verification failed');
  }

  return isValid;
}
