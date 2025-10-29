import { Router } from 'express';
import webhookRoutes from './webhook';

const router: Router = Router();

// Mount webhook routes
router.use('/webhook', webhookRoutes);

export default router;
