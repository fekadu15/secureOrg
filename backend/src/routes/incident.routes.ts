import { Router } from 'express';
import { IncidentController } from '../controllers/incident.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('incident.read'), IncidentController.listIncidents);
router.post('/', requirePermission('incident.create'), IncidentController.createIncident);
router.put('/:id', requirePermission('incident.manage'), IncidentController.updateIncident);

export default router;
