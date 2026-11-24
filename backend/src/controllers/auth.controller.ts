
import { Request, Response } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { CryptoService } from '../services/crypto.service.js';
import { TotpService } from '../services/totp.service.js';
import { AuditService } from '../services/audit.service.js';
import { config } from '../config/index.js';
import { AccountStatus, MfaChallengePurpose, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  unitId: z.string().optional(),
  password: z.string()
    .min(12)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  captchaSolution: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(4)
});

const mfaVerifySchema = z.object({
  email: z.string().email(),
  tempToken: z.string().min(20),
  code: z.string().min(6).max(32),
  isRecoveryCode: z.boolean().optional()
});

const enrollmentConfirmSchema = z.object({
  tempSetupToken: z.string().min(20),
  verificationCode: z.string().regex(/^\d{6}$/)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string()
    .min(12)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
});

const now = () => new Date();

const clearAuthCookies = (res: Response) => {
  const options = {
    httpOnly: true,
    secure: config.security.cookieSecure,
    sameSite: 'lax' as const,
    path: '/'
  };

  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          code: 'USER_EXISTS'
        }
      });
      return;
    }

    const passwordHash = await CryptoService.hashPassword(data.password);
    const verificationCode = randomInt(100000, 1000000).toString();
    const verificationToken = CryptoService.sha256(verificationCode);
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const employeeRole = await prisma.role.findUnique({
      where: { name: 'EMPLOYEE' }
    });

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        unitId: data.unitId || null,
        status: AccountStatus.PENDING_VERIFICATION,
        verificationToken,
        verificationTokenExpiresAt: tokenExpiresAt,
        ...(employeeRole
          ? {
              userRoles: {
                create: {
                  roleId: employeeRole.id,
                  assignedBy: 'SELF_REGISTRATION'
                }
              }
            }
          : {})
      }
    });

    await AuditService.log({
      actorId: newUser.id,
      actorEmail: newUser.email,
      action: 'USER_REGISTERED',
      resource: 'USER',
      resourceId: newUser.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { verificationRequired: true }
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Account created successfully. Please verify your email.',
        email: newUser.email,
        ...(config.nodeEnv === 'development'
          ? { verificationCodeSimulation: verificationCode }
          : {})
      }
    });
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    const { email, token } = verifyEmailSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid verification request.',
          code: 'INVALID_VERIFICATION'
        }
      });
      return;
    }

    if (user.status !== AccountStatus.PENDING_VERIFICATION) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Account is already verified or in an ineligible state.',
          code: 'ALREADY_VERIFIED'
        }
      });
      return;
    }

    const suppliedHash = CryptoService.sha256(token);
    const tokenMatches =
      user.verificationToken === suppliedHash ||
      user.verificationToken === token;

    if (
      !tokenMatches ||
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt < now()
    ) {
      await AuditService.log({
        actorEmail: user.email,
        action: 'EMAIL_VERIFICATION_FAILED',
        resource: 'USER',
        resourceId: user.id,
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired verification challenge code.',
          code: 'EXPIRED_VERIFICATION'
        }
      });
      return;
    }

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        status: AccountStatus.PENDING_VERIFICATION,
        verificationToken: user.verificationToken
      },
      data: {
        status: AccountStatus.ACTIVE,
        verificationToken: null,
        verificationTokenExpiresAt: null
      }
    });

    if (result.count !== 1) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Verification request is no longer valid.',
          code: 'INVALID_VERIFICATION'
        }
      });
      return;
    }

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'EMAIL_VERIFIED_ACTIVATED',
      resource: 'USER',
      resourceId: user.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Account successfully verified and activated. You can now sign in.'
      }
    });
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password credentials.',
          code: 'INVALID_CREDENTIALS'
        }
      });
      return;
    }

    if (user.lockoutUntil && user.lockoutUntil > now()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000
      );

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: 'AUTH_LOCKED_ATTEMPT',
        resource: 'AUTH',
        status: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { remainingMinutes }
      });

      res.status(423).json({
        success: false,
        error: {
          message: `Account is temporarily locked. Try again in ${remainingMinutes} minute(s).`,
          code: 'ACCOUNT_LOCKED',
          remainingMinutes
        }
      });
      return;
    }

    if (
      user.status === AccountStatus.SUSPENDED ||
      user.status === AccountStatus.DEACTIVATED
    ) {
      res.status(403).json({
        success: false,
        error: {
          message: `Account is ${user.status.toLowerCase()}. Please contact the administrator.`,
          code: `ACCOUNT_${user.status}`
        }
      });
      return;
    }

    if (user.status === AccountStatus.PENDING_VERIFICATION) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Please verify your email address before logging in.',
          code: 'ACCOUNT_PENDING_VERIFICATION'
        }
      });
      return;
    }

    const passwordValid = await CryptoService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      const updatedAttempts = user.failedLoginAttempts + 1;
      const lockout =
        updatedAttempts >= config.security.maxLoginAttempts
          ? new Date(
              Date.now() +
              config.security.lockoutDurationMinutes * 60 * 1000
            )
          : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          ...(lockout
            ? {
                lockoutUntil: lockout,
                status: AccountStatus.LOCKED
              }
            : {})
        }
      });

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: lockout ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_FAILED',
        resource: 'AUTH',
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { failedAttempts: updatedAttempts }
      });

      if (lockout) {
        res.status(423).json({
          success: false,
          error: {
            message: `Too many failed attempts. Account locked for ${config.security.lockoutDurationMinutes} minutes.`,
            code: 'ACCOUNT_LOCKED'
          }
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password credentials.',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: Math.max(
            0,
            config.security.maxLoginAttempts - updatedAttempts
          )
        }
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        status:
          user.status === AccountStatus.LOCKED
            ? AccountStatus.ACTIVE
            : user.status
      }
    });

    if (updatedUser.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: {
          message: 'This account is not active.',
          code: 'ACCOUNT_NOT_ACTIVE'
        }
      });
      return;
    }

    if (user.mfaEnabled) {
      if (user.mfaLockoutUntil && user.mfaLockoutUntil > now()) {
        const remainingMinutes = Math.ceil(
          (user.mfaLockoutUntil.getTime() - Date.now()) / 60000
        );

        res.status(423).json({
          success: false,
          error: {
            message: `MFA is temporarily locked. Try again in ${remainingMinutes} minute(s).`,
            code: 'MFA_LOCKED',
            remainingMinutes
          }
        });
        return;
      }

      const rawChallenge = CryptoService.generateRandomToken(32);
      const tokenHash = CryptoService.sha256(rawChallenge);
      const expiresAt = new Date(
        Date.now() +
        config.security.mfaChallengeExpiryMinutes * 60 * 1000
      );

      await prisma.mFAChallenge.create({
        data: {
          userId: user.id,
          tokenHash,
          purpose: MfaChallengePurpose.LOGIN,
          expiresAt
        }
      });

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: 'AUTH_PASSWORD_SUCCESS_MFA_CHALLENGE',
        resource: 'AUTH',
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(200).json({
        success: true,
        data: {
          mfaRequired: true,
          tempToken: rawChallenge,
          email: user.email
        }
      });
      return;
    }

    await AuthController.issueUserSession(updatedUser, req, res);
  }

  static async verifyMfa(req: Request, res: Response): Promise<void> {
    const {
      email,
      tempToken,
      code,
      isRecoveryCode
    } = mfaVerifySchema.parse(req.body);

    const tokenHash = CryptoService.sha256(tempToken);
    const challenge = await prisma.mFAChallenge.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { mfaFactor: true }
        }
      }
    });

    if (
      !challenge ||
      challenge.purpose !== MfaChallengePurpose.LOGIN ||
      challenge.consumedAt ||
      challenge.expiresAt <= now() ||
      challenge.user.email !== email.toLowerCase()
    ) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid, expired, or already used MFA challenge.',
          code: 'INVALID_MFA_CHALLENGE'
        }
      });
      return;
    }

    const user = challenge.user;

    if (
      user.status !== AccountStatus.ACTIVE ||
      !user.mfaEnabled ||
      !user.mfaFactor
    ) {
      res.status(403).json({
        success: false,
        error: {
          message: 'MFA is not available for this account.',
          code: 'MFA_NOT_CONFIGURED'
        }
      });
      return;
    }

    if (user.mfaLockoutUntil && user.mfaLockoutUntil > now()) {
      const remainingMinutes = Math.ceil(
        (user.mfaLockoutUntil.getTime() - Date.now()) / 60000
      );

      res.status(423).json({
        success: false,
        error: {
          message: `MFA is temporarily locked. Try again in ${remainingMinutes} minute(s).`,
          code: 'MFA_LOCKED',
          remainingMinutes
        }
      });
      return;
    }

    let acceptedTimeStep: number | null = null;
    let recoveryRecordId: string | null = null;

    if (isRecoveryCode) {
      const normalizedCode = code.trim().toUpperCase();
      const codeHash = CryptoService.sha256(normalizedCode);

      const recoveryRecord = await prisma.recoveryCode.findFirst({
        where: {
          userId: user.id,
          codeHash,
          isUsed: false
        }
      });

      if (recoveryRecord) {
        recoveryRecordId = recoveryRecord.id;
      }
    } else {
      const decryptedSecret = TotpService.decryptSecret(
        user.mfaFactor.secretEncrypted,
        user.mfaFactor.secretIv,
        user.mfaFactor.secretTag
      );

      acceptedTimeStep = TotpService.verifyTokenWithTimeStep(
        code.trim(),
        decryptedSecret
      );
    }

    const codeValid = isRecoveryCode
      ? recoveryRecordId !== null
      : acceptedTimeStep !== null;

    if (!codeValid) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { mfaFailedAttempts: { increment: 1 } }
      });

      const shouldLock =
        updated.mfaFailedAttempts >= config.security.mfaMaxAttempts;

      if (shouldLock) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            mfaLockoutUntil: new Date(
              Date.now() +
              config.security.mfaLockoutDurationMinutes * 60 * 1000
            )
          }
        });
      }

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: shouldLock
          ? 'MFA_ACCOUNT_LOCKED'
          : 'MFA_VERIFICATION_FAILED',
        resource: 'AUTH',
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { isRecoveryCode: !!isRecoveryCode }
      });

      res.status(shouldLock ? 423 : 401).json({
        success: false,
        error: {
          message: shouldLock
            ? `Too many failed MFA attempts. Try again in ${config.security.mfaLockoutDurationMinutes} minutes.`
            : 'Invalid MFA verification code or recovery code.',
          code: shouldLock ? 'MFA_LOCKED' : 'INVALID_MFA_CODE',
          ...(shouldLock
            ? { remainingMinutes: config.security.mfaLockoutDurationMinutes }
            : {
                attemptsRemaining: Math.max(
                  0,
                  config.security.mfaMaxAttempts - updated.mfaFailedAttempts
                )
              })
        }
      });
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const consumedChallenge = await tx.mFAChallenge.updateMany({
          where: {
            id: challenge.id,
            consumedAt: null,
            expiresAt: { gt: now() }
          },
          data: { consumedAt: now() }
        });

        if (consumedChallenge.count !== 1) {
          throw new Error('MFA_CHALLENGE_ALREADY_USED');
        }

        if (isRecoveryCode && recoveryRecordId) {
          const consumedRecoveryCode = await tx.recoveryCode.updateMany({
            where: {
              id: recoveryRecordId,
              userId: user.id,
              isUsed: false
            },
            data: {
              isUsed: true,
              usedAt: now()
            }
          });

          if (consumedRecoveryCode.count !== 1) {
            throw new Error('RECOVERY_CODE_ALREADY_USED');
          }
        } else if (acceptedTimeStep !== null) {
          const updatedFactor = await tx.mFAFactor.updateMany({
            where: {
              id: user.mfaFactor!.id,
              OR: [
                { lastUsedTimeStep: null },
                { lastUsedTimeStep: { lt: acceptedTimeStep } }
              ]
            },
            data: {
              lastUsedTimeStep: acceptedTimeStep,
              lastUsedAt: now()
            }
          });

          if (updatedFactor.count !== 1) {
            throw new Error('TOTP_CODE_ALREADY_USED');
          }
        }

        await tx.user.update({
          where: { id: user.id },
          data: {
            mfaFailedAttempts: 0,
            mfaLockoutUntil: null
          }
        });
      });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          'MFA_CHALLENGE_ALREADY_USED',
          'RECOVERY_CODE_ALREADY_USED',
          'TOTP_CODE_ALREADY_USED'
        ].includes(error.message)
      ) {
        res.status(401).json({
          success: false,
          error: {
            message: 'This MFA challenge or code has already been used.',
            code: 'MFA_CHALLENGE_OR_CODE_REUSED'
          }
        });
        return;
      }

      throw error;
    }

    if (isRecoveryCode) {
      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: 'MFA_RECOVERY_CODE_CONSUMED',
        resource: 'AUTH',
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    await AuthController.issueUserSession(user, req, res);
  }

  private static async issueUserSession(
    user: { id: string },
    req: Request,
    res: Response
  ): Promise<void> {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        unit: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!fullUser || fullUser.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: {
          message: 'This account is not active.',
          code: 'ACCOUNT_NOT_ACTIVE'
        }
      });
      return;
    }

    const roles: string[] = [];
    const permissions = new Set<string>();

    for (const userRole of fullUser.userRoles) {
      if (
        userRole.revokedAt ||
        (userRole.expiresAt && userRole.expiresAt < now())
      ) {
        continue;
      }

      roles.push(userRole.role.name);

      for (const rolePermission of userRole.role.rolePermissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    const accessToken = (await import('jsonwebtoken')).default.sign(
      {
        userId: fullUser.id,
        email: fullUser.email,
        roles,
        permissions: Array.from(permissions)
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry as any }
    );

    const rawRefreshToken = CryptoService.generateRandomToken(48);
    const refreshTokenHash = CryptoService.sha256(rawRefreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        userId: fullUser.id,
        refreshTokenHash,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        expiresAt: refreshExpiresAt,
        isValid: true
      }
    });

    await prisma.user.update({
      where: { id: fullUser.id },
      data: { lastLoginAt: now() }
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.security.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: config.security.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await AuditService.log({
      actorId: fullUser.id,
      actorEmail: fullUser.email,
      action: 'AUTH_SESSION_ESTABLISHED',
      resource: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { roles }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: fullUser.id,
          email: fullUser.email,
          fullName: fullUser.fullName,
          roles,
          permissions: Array.from(permissions),
          mfaEnabled: fullUser.mfaEnabled,
          unit: fullUser.unit
            ? {
                id: fullUser.unit.id,
                name: fullUser.unit.name,
                code: fullUser.unit.code
              }
            : null
        },
        accessToken
      }
    });
  }

  static async initiateMfaEnrollment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: { message: 'Account is not active.' }
      });
      return;
    }

    if (user.mfaEnabled) {
      res.status(409).json({
        success: false,
        error: {
          message: 'MFA is already enabled. Disable it through the secure MFA management process before enrolling again.',
          code: 'MFA_ALREADY_ENABLED'
        }
      });
      return;
    }

    const secret = TotpService.generateSecret();
    const otpAuthUrl = TotpService.generateOtpAuthUrl(user.email, secret);
    const qrCodeDataUrl = await TotpService.generateQrCodeDataUrl(otpAuthUrl);
    const encrypted = TotpService.encryptSecret(secret);

    const rawChallenge = CryptoService.generateRandomToken(32);
    const tokenHash = CryptoService.sha256(rawChallenge);
    const expiresAt = new Date(
      Date.now() +
      config.security.mfaEnrollmentExpiryMinutes * 60 * 1000
    );

    await prisma.mFAChallenge.deleteMany({
      where: {
        userId: user.id,
        purpose: MfaChallengePurpose.ENROLLMENT
      }
    });

    await prisma.mFAChallenge.create({
      data: {
        userId: user.id,
        tokenHash,
        purpose: MfaChallengePurpose.ENROLLMENT,
        secretEncrypted: encrypted.encrypted,
        secretIv: encrypted.iv,
        secretTag: encrypted.tag,
        expiresAt
      }
    });

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'MFA_ENROLLMENT_INITIATED',
      resource: 'MFA',
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: {
        secret,
        qrCodeDataUrl,
        tempSetupToken: rawChallenge,
        expiresAt
      }
    });
  }

  static async finalizeMfaEnrollment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
      return;
    }

    const { tempSetupToken, verificationCode } =
      enrollmentConfirmSchema.parse(req.body);

    const tokenHash = CryptoService.sha256(tempSetupToken);

    const challenge = await prisma.mFAChallenge.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (
      !challenge ||
      challenge.userId !== req.user.id ||
      challenge.purpose !== MfaChallengePurpose.ENROLLMENT ||
      challenge.consumedAt ||
      challenge.expiresAt <= now() ||
      !challenge.secretEncrypted ||
      !challenge.secretIv ||
      !challenge.secretTag
    ) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired MFA enrollment session. Start enrollment again.',
          code: 'INVALID_MFA_ENROLLMENT'
        }
      });
      return;
    }

    if (
      challenge.user.status !== AccountStatus.ACTIVE ||
      challenge.user.mfaEnabled
    ) {
      res.status(403).json({
        success: false,
        error: {
          message: 'MFA enrollment is not available for this account.',
          code: 'MFA_ENROLLMENT_NOT_ALLOWED'
        }
      });
      return;
    }

    const secret = TotpService.decryptSecret(
      challenge.secretEncrypted,
      challenge.secretIv,
      challenge.secretTag
    );

    const acceptedTimeStep = TotpService.verifyTokenWithTimeStep(
      verificationCode,
      secret
    );

    if (acceptedTimeStep === null) {
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'MFA_ENROLLMENT_FAILED',
        resource: 'MFA',
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid 6-digit TOTP verification code.',
          code: 'INVALID_MFA_CODE'
        }
      });
      return;
    }

    const { rawCodes, hashedCodes } =
      CryptoService.generateRecoveryCodes(8);

    await prisma.$transaction(async (tx) => {
      const consumed = await tx.mFAChallenge.updateMany({
        where: {
          id: challenge.id,
          userId: req.user!.id,
          consumedAt: null,
          expiresAt: { gt: now() }
        },
        data: { consumedAt: now() }
      });

      if (consumed.count !== 1) {
        throw new Error('MFA_ENROLLMENT_CHALLENGE_ALREADY_USED');
      }

      await tx.mFAFactor.upsert({
        where: { userId: req.user!.id },
        update: {
          secretEncrypted: challenge.secretEncrypted!,
          secretIv: challenge.secretIv!,
          secretTag: challenge.secretTag!,
          enabledAt: now(),
          lastUsedAt: now(),
          lastUsedTimeStep: acceptedTimeStep
        },
        create: {
          userId: req.user!.id,
          secretEncrypted: challenge.secretEncrypted!,
          secretIv: challenge.secretIv!,
          secretTag: challenge.secretTag!,
          lastUsedAt: now(),
          lastUsedTimeStep: acceptedTimeStep
        }
      });

      await tx.recoveryCode.deleteMany({
        where: { userId: req.user!.id }
      });

      await tx.recoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({
          userId: req.user!.id,
          codeHash,
          isUsed: false
        }))
      });

      await tx.user.update({
        where: { id: req.user!.id },
        data: {
          mfaEnabled: true,
          mfaFailedAttempts: 0,
          mfaLockoutUntil: null
        }
      });
    });

    await AuditService.log({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'MFA_ENROLLED',
      resource: 'MFA',
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'MFA successfully activated. Save these backup recovery codes in a secure vault.',
        recoveryCodes: rawCodes
      }
    });
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user && user.status === AccountStatus.ACTIVE) {
      const resetToken = CryptoService.generateRandomToken(32);
      const resetTokenHash = CryptoService.sha256(resetToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetTokenHash,
          passwordResetExpiresAt: expiresAt
        }
      });

      await AuditService.log({
        actorId: user.id,
        actorEmail: user.email,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'AUTH',
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'If an active account exists, password reset instructions have been issued.',
          ...(config.nodeEnv === 'development'
            ? { resetTokenSimulation: resetToken }
            : {})
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'If an active account exists, password reset instructions have been issued.'
      }
    });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const suppliedHash = CryptoService.sha256(token);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { passwordResetToken: suppliedHash },
          { passwordResetToken: token }
        ],
        passwordResetExpiresAt: { gt: now() },
        status: {
          in: [AccountStatus.ACTIVE, AccountStatus.LOCKED]
        }
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired password reset token.',
          code: 'INVALID_RESET_TOKEN'
        }
      });
      return;
    }

    const passwordHash = await CryptoService.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          mfaFailedAttempts: 0,
          mfaLockoutUntil: null,
          status:
            user.status === AccountStatus.LOCKED
              ? AccountStatus.ACTIVE
              : user.status
        }
      }),
      prisma.session.updateMany({
        where: { userId: user.id },
        data: { isValid: false }
      }),
      prisma.mFAChallenge.deleteMany({
        where: { userId: user.id }
      })
    ]);

    clearAuthCookies(res);

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successful. Please sign in with your new credentials.'
      }
    });
  }

  static async logout(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (rawRefreshToken) {
      const refreshTokenHash = CryptoService.sha256(rawRefreshToken);

      await prisma.session.updateMany({
        where: { refreshTokenHash },
        data: { isValid: false }
      });
    }

    if (req.user) {
      await AuditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'AUTH_LOGOUT',
        resource: 'AUTH',
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      data: { message: 'Successfully signed out.' }
    });
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token not found.',
          code: 'REFRESH_TOKEN_REQUIRED'
        }
      });
      return;
    }

    const refreshTokenHash = CryptoService.sha256(rawRefreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true }
    });

    if (
      !session ||
      !session.isValid ||
      session.expiresAt <= now() ||
      session.user.status !== AccountStatus.ACTIVE
    ) {
      clearAuthCookies(res);

      res.status(401).json({
        success: false,
        error: {
          message: 'Session expired or invalidated. Please sign in again.',
          code: 'INVALID_SESSION'
        }
      });
      return;
    }

    const rotated = await prisma.session.updateMany({
      where: {
        id: session.id,
        isValid: true,
        expiresAt: { gt: now() }
      },
      data: { isValid: false }
    });

    if (rotated.count !== 1) {
      clearAuthCookies(res);

      res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token has already been used.',
          code: 'REFRESH_TOKEN_REUSED'
        }
      });
      return;
    }

    await AuthController.issueUserSession(session.user, req, res);
  }

  static async getMe(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { unit: true }
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found or inactive.' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
          roles: req.user.roles,
          permissions: req.user.permissions,
          unit: user.unit
            ? {
                id: user.unit.id,
                name: user.unit.name,
                code: user.unit.code
              }
            : null,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  }
}
