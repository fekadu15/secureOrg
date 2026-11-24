import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('user.read'), UserController.listUsers);
router.post('/', requirePermission('user.create'), UserController.createUser);
router.get('/profile', UserController.getUserById); // can fetch self
router.put('/profile', UserController.updateProfile);
router.get('/:id', requirePermission('user.read'), UserController.getUserById);
router.put('/:id/status', requirePermission('user.status'), UserController.updateStatus);

export default router;
