
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

export class CryptoService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptSaltRounds);
  }

  static async verifyPassword(
    candidate: string,
    hash: string
  ): Promise<boolean> {
    if (typeof candidate !== 'string' || typeof hash !== 'string') {
      return false;
    }

    try {
      return await bcrypt.compare(candidate, hash);
    } catch {
      return false;
    }
  }

  static generateRandomToken(bytes = 32): string {
    if (
      !Number.isSafeInteger(bytes) ||
      bytes < 16 ||
      bytes > 1024
    ) {
      throw new Error('Token byte length must be between 16 and 1024.');
    }

    return crypto.randomBytes(bytes).toString('hex');
  }

  static encrypt(
    plaintext: string
  ): { encrypted: string; iv: string; tag: string } {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new Error('Encryption plaintext must be a non-empty string.');
    }

    const key = Buffer.from(config.crypto.encryptionKey, 'hex');

    if (key.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes (64 hexadecimal characters).');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  static decrypt(
    encryptedHex: string,
    ivHex: string,
    tagHex: string
  ): string {
    if (
      typeof encryptedHex !== 'string' ||
      typeof ivHex !== 'string' ||
      typeof tagHex !== 'string' ||
      !/^(?:[0-9a-fA-F]{2})*$/.test(encryptedHex) ||
      !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
      !/^[0-9a-fA-F]{32}$/.test(tagHex)
    ) {
      throw new Error('Invalid encrypted data format.');
    }

    const key = Buffer.from(config.crypto.encryptionKey, 'hex');

    if (key.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes (64 hexadecimal characters).');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  static computeEventHash(
    previousHash: string,
    timestamp: Date,
    actorEmail: string,
    action: string,
    resource: string,
    status: string,
    metadata: unknown
  ): string {
    const metaStr = metadata ? JSON.stringify(metadata) : '';

    const payload = `${previousHash}|${timestamp.toISOString()}|${actorEmail}|${action}|${resource}|${status}|${metaStr}`;

    return this.sha256(payload);
  }

  static generateRecoveryCodes(
    count = 8
  ): { rawCodes: string[]; hashedCodes: string[] } {
    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > 20
    ) {
      throw new Error('Recovery code count must be between 1 and 20.');
    }

    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const randomBytes = crypto.randomBytes(8);
      const hex = randomBytes.toString('hex').toUpperCase();

      const code = hex.match(/.{4}/g)!.join('-');

      rawCodes.push(code);
      hashedCodes.push(this.sha256(code));
    }

    return {
      rawCodes,
      hashedCodes,
    };
  }
}
