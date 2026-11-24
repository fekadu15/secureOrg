import { Router } from 'express';
import { PolicyController } from '../controllers/policy.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', PolicyController.listPolicies);
router.post('/', requirePermission('policy.manage'), PolicyController.createPolicy);
router.post('/:id/acknowledge', requirePermission('policy.acknowledge'), PolicyController.acknowledgePolicy);

export default router;
