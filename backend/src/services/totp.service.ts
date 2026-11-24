
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { CryptoService } from './crypto.service.js';
import { HashAlgorithms } from '@otplib/core';
const TOTP_STEP_SECONDS = 30;

authenticator.options = {
  algorithm: HashAlgorithms.SHA1,
  digits: 6,
  step: TOTP_STEP_SECONDS,
  window: 1,
};

export interface TotpVerificationResult {
  valid: boolean;
  timeStep: number | null;
}

export class TotpService {
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  static generateOtpAuthUrl(
    email: string,
    secret: string,
    issuer = 'SecureOrg'
  ): string {
    return authenticator.keyuri(email, issuer, secret);
  }

  static async generateQrCodeDataUrl(
    otpAuthUrl: string
  ): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: 'M',
      width: 256,
      margin: 2,
    });
  }

  static verifyToken(
    token: string,
    secret: string
  ): boolean {
    if (
      typeof token !== 'string' ||
      !/^\d{6}$/.test(token) ||
      typeof secret !== 'string' ||
      !secret.trim()
    ) {
      return false;
    }

    try {
      return authenticator.check(token, secret);
    } catch {
      return false;
    }
  }

  static verifyTokenWithTimeStep(
  token: string,
  secret: string
): number | null {
  if (!/^\d{6}$/.test(token)) {
    return null;
  }

  const delta = authenticator.checkDelta(token, secret);

  if (delta === null || delta === undefined) {
    return null;
  }

  const currentTimeStep = Math.floor(
    Date.now() / 1000 / TOTP_STEP_SECONDS
  );

  return currentTimeStep + delta;
}

  static encryptSecret(secret: string) {
    return CryptoService.encrypt(secret);
  }

  static decryptSecret(
    encrypted: string,
    iv: string,
    tag: string
  ): string {
    return CryptoService.decrypt(encrypted, iv, tag);
  }
}
