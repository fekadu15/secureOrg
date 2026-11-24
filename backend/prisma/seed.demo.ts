
import {
  PrismaClient,
  AccountStatus,
  AlertSeverity,
  AlertStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seeding is disabled in production.');
  }

  if (process.env.SEED_DEMO_DATA !== 'true') {
    throw new Error(
      'Demo seeding is disabled. Set SEED_DEMO_DATA=true to enable it.'
    );
  }

  const demoPassword = process.env.DEMO_USER_PASSWORD;

  if (!demoPassword || demoPassword.length < 12) {
    throw new Error(
      'DEMO_USER_PASSWORD must be set and contain at least 12 characters.'
    );
  }

  console.log('--- Starting SecureOrg demo seeding ---');

  
  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: [
          'ADMIN',
          'SECURITY_OFFICER',
          'DEPARTMENT_MANAGER',
          'EMPLOYEE'
        ]
      }
    }
  });

  const roleMap = new Map(roles.map((role) => [role.name, role]));

  const requiredRoles = [
    'ADMIN',
    'SECURITY_OFFICER',
    'DEPARTMENT_MANAGER',
    'EMPLOYEE'
  ];

  for (const roleName of requiredRoles) {
    if (!roleMap.has(roleName)) {
      throw new Error(
        `Role ${roleName} does not exist. Run seed.ts first.`
      );
    }
  }

  // 2. Get organizational units created by seed.ts
  const units = await prisma.organizationalUnit.findMany({
    where: {
      code: {
        in: ['IT-ADMIN', 'SEC-OPS', 'ENG', 'FIN']
      }
    }
  });

  const unitMap = new Map(units.map((unit) => [unit.code, unit]));

  const requiredUnits = ['IT-ADMIN', 'SEC-OPS', 'ENG', 'FIN'];

  for (const unitCode of requiredUnits) {
    if (!unitMap.has(unitCode)) {
      throw new Error(
        `Organizational unit ${unitCode} does not exist. Run seed.ts first.`
      );
    }
  }

  // 3. Demo users
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const usersData = [
    {
      email: 'admin@secureorg.test',
      fullName: 'Esrael',
      phone: '+251900000001',
      roleName: 'ADMIN',
      unitCode: 'IT-ADMIN'
    },
    {
      email: 'officer@secureorg.test',
      fullName: 'Ezra',
      phone: '+251900000002',
      roleName: 'SECURITY_OFFICER',
      unitCode: 'SEC-OPS'
    },
    {
      email: 'manager@secureorg.test',
      fullName: 'Elleni',
      phone: '+251900000003',
      roleName: 'DEPARTMENT_MANAGER',
      unitCode: 'ENG'
    },
    {
      email: 'employee@secureorg.test',
      fullName: 'Sarah Tesfaye',
      phone: '+251900000004',
      roleName: 'EMPLOYEE',
      unitCode: 'ENG'
    },
    {
      email: 'dawit@secureorg.test',
      fullName: 'Dev',
      phone: '+251900000005',
      roleName: 'EMPLOYEE',
      unitCode: 'FIN'
    }
  ];

  for (const item of usersData) {
    const role = roleMap.get(item.roleName)!;
    const unit = unitMap.get(item.unitCode)!;

    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        fullName: item.fullName,
        phone: item.phone,
        passwordHash,
        status: AccountStatus.ACTIVE,
        unitId: unit.id,
        mfaEnabled: false
      },
      create: {
        email: item.email,
        fullName: item.fullName,
        phone: item.phone,
        passwordHash,
        status: AccountStatus.ACTIVE,
        unitId: unit.id,
        mfaEnabled: false
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id
        }
      },
      update: {
        revokedAt: null,
        expiresAt: null,
        isTemporary: false
      },
      create: {
        userId: user.id,
        roleId: role.id,
        assignedBy: 'SYSTEM'
      }
    });
  }

  console.log(`Seeded ${usersData.length} demo users.`);

  // 4. Demo risks
  const risks = [
    {
      title: 'Privilege Escalation via Stale Permissions',
      category: 'Access Control',
      description: 'Users retaining elevated permissions after transitioning between organizational units.',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      status: 'TREATING',
      owner: 'Marcus Vance (Security Officer)',
      treatmentStrategy: 'Enforce mandatory quarterly access reviews and automated temporary privilege expiration.'
    },
    {
      title: 'Credential Stuffing and Brute-Force Attacks',
      category: 'Authentication',
      description: 'Automated brute-force attacks against the enterprise authentication endpoint.',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      status: 'MITIGATED',
      owner: 'Alexander Wright (Administrator)',
      treatmentStrategy: 'Implement rate limiting, account lockout and MFA.'
    },
    {
      title: 'Ransomware Data Corruption in Database Storage',
      category: 'Resilience',
      description: 'Host-level compromise leading to corruption of operational relational database tables.',
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      status: 'TREATING',
      owner: 'Alexander Wright (Administrator)',
      treatmentStrategy: 'Maintain encrypted database backups and follow a 3-2-1 backup architecture.'
    }
  ];

  for (const risk of risks) {
    const existing = await prisma.risk.findFirst({
      where: { title: risk.title }
    });

    if (existing) {
      await prisma.risk.update({
        where: { id: existing.id },
        data: risk
      });
    } else {
      await prisma.risk.create({
        data: risk
      });
    }
  }

  console.log('Seeded demo risks.');

  // 5. Initial demo alert
  const existingAlert = await prisma.securityAlert.findFirst({
    where: {
      type: 'POLICY_NOTIFICATION',
      title: 'Platform Baseline Initialized'
    }
  });

  if (!existingAlert) {
    await prisma.securityAlert.create({
      data: {
        type: 'POLICY_NOTIFICATION',
        severity: AlertSeverity.LOW,
        title: 'Platform Baseline Initialized',
        description: 'SecureOrg demo data has been initialized.',
        status: AlertStatus.NEW
      }
    });
  }

  console.log('Seeded demo security alert.');
  console.log('--- SecureOrg demo seeding complete ---');
}

main()
  .catch((error) => {
    console.error('Error during demo seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
