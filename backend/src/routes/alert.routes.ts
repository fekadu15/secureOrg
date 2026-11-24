import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('alert.read'), AlertController.listAlerts);
router.put('/:id', requirePermission('alert.manage'), AlertController.updateAlert);

export default router;
