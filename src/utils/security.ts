import crypto from 'crypto';
import { Request } from 'express';

/**
 * Verifies that the webhook request is from Meta using HMAC SHA-256 signature
 * @param req - Express request object
 * @returns boolean indicating if signature is valid
 */
export function verifyRequestSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.log('No signature found in request headers');
    return false;
  }

  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    console.log('APP_SECRET not configured');
    return false;
  }

  // Extract the signature hash (remove 'sha256=' prefix)
  const signatureHash = signature.split('sha256=')[1];

  // Calculate expected signature
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Compare signatures using timing-safe comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signatureHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );

  if (!isValid) {
    console.log('Signature verification failed');
  }

  return isValid;
}
