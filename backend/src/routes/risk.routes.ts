import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', RiskController.listRisks);
router.post('/', requirePermission('risk.create'), RiskController.createRisk);
router.put('/:id', requirePermission('risk.manage'), RiskController.updateRisk);

export default router;
