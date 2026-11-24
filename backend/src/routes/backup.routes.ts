import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('backup.create'), BackupController.listBackups);
router.post('/trigger', requirePermission('backup.create'), BackupController.triggerBackup);
router.post('/restore-drill', requirePermission('backup.restore'), BackupController.restoreDrill);

export default router;
