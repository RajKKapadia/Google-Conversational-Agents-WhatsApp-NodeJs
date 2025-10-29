import { Router } from 'express';
import { verifyWebhook, handleWebhook } from '../controllers/webhookController';

const router: Router = Router();

// GET /webhook - Webhook verification
router.get('/', verifyWebhook);

// POST /webhook - Receive messages
router.post('/', handleWebhook);

export default router;
