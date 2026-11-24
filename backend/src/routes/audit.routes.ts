import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('audit.read'), AuditController.listEvents);
router.post('/verify-integrity', requirePermission('audit.verify'), AuditController.verifyIntegrity);

export default router;
