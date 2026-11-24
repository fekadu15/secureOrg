
import { prisma } from '../utils/prisma.js';
import { CryptoService } from './crypto.service.js';
import { AlertSeverity, AlertStatus } from '@prisma/client';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface CreateAuditOptions {
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  static async log(options: CreateAuditOptions) {
    try {
      const timestamp = new Date();
      const actorEmail = options.actorEmail || 'SYSTEM';

      const lastEvent = await prisma.auditEvent.findFirst({
        orderBy: [
          { timestamp: 'desc' },
          { id: 'desc' }
        ]
      });

      const previousHash = lastEvent
        ? lastEvent.eventHash
        : GENESIS_HASH;

      const metadata = options.metadata
        ? options.metadata as object
        : undefined;

      const eventHash = CryptoService.computeEventHash(
        previousHash,
        timestamp,
        actorEmail,
        options.action,
        options.resource,
        options.status,
        metadata
      );

      const record = await prisma.auditEvent.create({
        data: {
          actorId: options.actorId,
          actorEmail,
          action: options.action,
          resource: options.resource,
          resourceId: options.resourceId,
          status: options.status,
          ipAddress: options.ipAddress || 'unknown',
          userAgent: options.userAgent || 'unknown',
          metadata,
          previousHash,
          eventHash,
          timestamp
        }
      });

      await this.detectAndTriggerAlerts(options, record.id);

      return record;
    } catch (err) {
      console.error('AuditService.log error:', err);
      return undefined;
    }
  }

  private static async detectAndTriggerAlerts(
    options: CreateAuditOptions,
    eventId: string
  ) {
    try {
      if (options.action === 'AUTH_ACCOUNT_LOCKED') {
        await prisma.securityAlert.create({
          data: {
            type: 'BRUTE_FORCE_LOCKOUT',
            severity: AlertSeverity.HIGH,
            title: `Account Locked: ${options.actorEmail || 'Unknown'}`,
            description: `Account ${options.actorEmail || 'Unknown'} was locked due to repeated failed login attempts from IP ${options.ipAddress || 'unknown'}.`,
            status: AlertStatus.NEW,
            sourceEventId: eventId
          }
        });
      }

      if (
        options.action === 'ROLE_CHANGE_REQUEST_CREATED' &&
        options.metadata &&
        options.metadata.isPrivileged === true
      ) {
        await prisma.securityAlert.create({
          data: {
            type: 'PRIVILEGE_ELEVATION_REQUEST',
            severity: AlertSeverity.MEDIUM,
            title: 'Privileged Role Request Submitted',
            description: `User ${options.actorEmail || 'Unknown'} submitted a privileged role elevation request requiring independent review.`,
            status: AlertStatus.NEW,
            sourceEventId: eventId
          }
        });
      }

      if (options.action === 'SEPARATION_OF_DUTIES_VIOLATION') {
        await prisma.securityAlert.create({
          data: {
            type: 'SEPARATION_OF_DUTIES_VIOLATION',
            severity: AlertSeverity.CRITICAL,
            title: 'Separation of Duties Violation Attempt',
            description: `User ${options.actorEmail || 'Unknown'} attempted to approve their own privileged role request. The attempt was blocked and escalated.`,
            status: AlertStatus.NEW,
            sourceEventId: eventId
          }
        });
      }

      if (options.action === 'MFA_RESET') {
        await prisma.securityAlert.create({
          data: {
            type: 'MFA_RESET',
            severity: AlertSeverity.HIGH,
            title: `Multi-Factor Authentication Reset: ${options.resourceId || 'Unknown'}`,
            description: `MFA factor was reset for user ${options.resourceId || 'Unknown'} by ${options.actorEmail || 'Unknown'}. Verify legitimacy.`,
            status: AlertStatus.NEW,
            sourceEventId: eventId
          }
        });
      }
    } catch (alertErr) {
      console.error('Error triggering automated alert:', alertErr);
    }
  }

  static async verifyChain(): Promise<{
    isValid: boolean;
    totalRecords: number;
    verifiedRecords: number;
    compromisedRecordId?: string;
    details?: string;
  }> {
    const records = await prisma.auditEvent.findMany({
      orderBy: [
        { timestamp: 'asc' },
        { id: 'asc' }
      ]
    });

    if (records.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        verifiedRecords: 0
      };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      if (rec.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: records.length,
          verifiedRecords: i,
          compromisedRecordId: rec.id,
          details: `Broken hash chain at record ID ${rec.id}: expected previous hash ${expectedPrevHash}, found ${rec.previousHash}`
        };
      }

      const recomputedHash = CryptoService.computeEventHash(
        rec.previousHash,
        rec.timestamp,
        rec.actorEmail || 'SYSTEM',
        rec.action,
        rec.resource,
        rec.status,
        rec.metadata
      );

      if (recomputedHash !== rec.eventHash) {
        return {
          isValid: false,
          totalRecords: records.length,
          verifiedRecords: i,
          compromisedRecordId: rec.id,
          details: `Content tampering detected at record ID ${rec.id}: recorded hash ${rec.eventHash} does not match computed hash ${recomputedHash}`
        };
      }

      expectedPrevHash = rec.eventHash;
    }

    return {
      isValid: true,
      totalRecords: records.length,
      verifiedRecords: records.length
    };
  }
}
