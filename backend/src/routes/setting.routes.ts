import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/dashboard-stats', SettingController.getDashboardStats);
router.get('/units', SettingController.listUnits);
router.get('/', requirePermission('settings.manage'), SettingController.listSettings);
router.put('/', requirePermission('settings.manage'), SettingController.updateSetting);

export default router;
