
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import {
  authRateLimiter,
  mfaRateLimiter
} from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, AuthController.register);
router.post('/verify-email', authRateLimiter, AuthController.verifyEmail);
router.post('/login', authRateLimiter, AuthController.login);

router.post('/verify-mfa', mfaRateLimiter, AuthController.verifyMfa);

router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.post('/refresh-token', authRateLimiter, AuthController.refreshToken);

router.post('/logout', authenticateJwt, AuthController.logout);
router.get('/me', authenticateJwt, AuthController.getMe);

router.post(
  '/mfa/enroll',
  authenticateJwt,
  mfaRateLimiter,
  AuthController.initiateMfaEnrollment
);

router.post(
  '/mfa/confirm',
  authenticateJwt,
  mfaRateLimiter,
  AuthController.finalizeMfaEnrollment
);

export default router;
