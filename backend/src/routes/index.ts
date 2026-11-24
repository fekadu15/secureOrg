import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roleRoutes from './role.routes.js';
import auditRoutes from './audit.routes.js';
import alertRoutes from './alert.routes.js';
import backupRoutes from './backup.routes.js';
import incidentRoutes from './incident.routes.js';
import riskRoutes from './risk.routes.js';
import policyRoutes from './policy.routes.js';
import settingRoutes from './setting.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/alerts', alertRoutes);
apiRouter.use('/backups', backupRoutes);
apiRouter.use('/incidents', incidentRoutes);
apiRouter.use('/risks', riskRoutes);
apiRouter.use('/policies', policyRoutes);
apiRouter.use('/system', settingRoutes);

export default apiRouter;
