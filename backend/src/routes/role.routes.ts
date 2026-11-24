import { Router } from 'express';
import { RoleController } from '../controllers/role.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('role.read'), RoleController.listRoles);
router.get('/permissions', requirePermission('role.read'), RoleController.listPermissions);
router.get('/requests', RoleController.listRoleRequests);
router.post('/requests', requirePermission('role.request'), RoleController.createRoleRequest);
// Note: approve requires 'role.approve' AND passes server-side separation of duties check
router.post('/requests/:id/review', requirePermission('role.approve'), RoleController.reviewRoleRequest);

export default router;
