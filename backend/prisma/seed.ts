
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting SecureOrg baseline seeding ---');

  // 1. Organizational Units
  const unitsData = [
    {
      name: 'Security Operations & Governance',
      code: 'SEC-OPS',
      description: 'Information security, monitoring, SOC and compliance'
    },
    {
      name: 'IT Infrastructure & Administration',
      code: 'IT-ADMIN',
      description: 'Enterprise IT infrastructure, directory services and backups'
    },
    {
      name: 'Software Engineering',
      code: 'ENG',
      description: 'Core product engineering and development'
    },
    {
      name: 'Human Resources',
      code: 'HR',
      description: 'People operations and organizational management'
    },
    {
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Financial controls and accounting audits'
    }
  ];

  const units = await Promise.all(
    unitsData.map((unit) =>
      prisma.organizationalUnit.upsert({
        where: { code: unit.code },
        update: {
          name: unit.name,
          description: unit.description
        },
        create: unit
      })
    )
  );

  console.log(`Seeded ${units.length} organizational units.`);

  // 2. Permissions
  const permissionsList = [
    { code: 'user.create', name: 'Create Users', module: 'Identity', description: 'Invite and register new user accounts' },
    { code: 'user.read', name: 'View Users', module: 'Identity', description: 'View user directory and profiles' },
    { code: 'user.update', name: 'Update Users', module: 'Identity', description: 'Modify user profiles and metadata' },
    { code: 'user.delete', name: 'Deactivate Users', module: 'Identity', description: 'Suspend or deactivate accounts' },
    { code: 'user.status', name: 'Change Account Status', module: 'Identity', description: 'Lock, unlock, suspend or reactivate accounts' },

    { code: 'role.read', name: 'View Roles', module: 'Access Control', description: 'View roles, permissions and assignments' },
    { code: 'role.assign', name: 'Assign Standard Roles', module: 'Access Control', description: 'Assign standard non-privileged roles' },
    { code: 'role.request', name: 'Request Role Change', module: 'Access Control', description: 'Submit role elevation or transfer requests' },
    { code: 'role.approve', name: 'Approve Privileged Roles', module: 'Access Control', description: 'Independently approve privileged role requests' },
    { code: 'access.review', name: 'Conduct Access Reviews', module: 'Access Control', description: 'Perform periodic access reviews' },

    { code: 'audit.read', name: 'View Audit Logs', module: 'Audit', description: 'Inspect system and user audit records' },
    { code: 'audit.verify', name: 'Verify Log Integrity', module: 'Audit', description: 'Run cryptographic hash chain verifications' },
    { code: 'audit.export', name: 'Export Audit Logs', module: 'Audit', description: 'Export compliance audit reports' },

    { code: 'alert.read', name: 'View Security Alerts', module: 'Monitoring', description: 'View security alerts' },
    { code: 'alert.manage', name: 'Manage Security Alerts', module: 'Monitoring', description: 'Acknowledge, assign, investigate and resolve alerts' },

    { code: 'incident.create', name: 'Report Incident', module: 'Incidents', description: 'Submit security incident reports' },
    { code: 'incident.read', name: 'View Incidents', module: 'Incidents', description: 'View incident logs and timelines' },
    { code: 'incident.manage', name: 'Manage Incidents', module: 'Incidents', description: 'Manage incident lifecycle and containment' },

    { code: 'backup.create', name: 'Create Backups', module: 'Resilience', description: 'Trigger database backups' },
    { code: 'backup.restore', name: 'Restore Backups', module: 'Resilience', description: 'Initiate restore drills and tests' },
    { code: 'backup.delete', name: 'Delete Backups', module: 'Resilience', description: 'Purge aged backups according to policy' },

    { code: 'risk.create', name: 'Create Risk Items', module: 'Governance', description: 'Register new organizational risks' },
    { code: 'risk.manage', name: 'Manage Risk Register', module: 'Governance', description: 'Update risk mitigation strategies and scores' },
    { code: 'policy.manage', name: 'Manage Policies', module: 'Governance', description: 'Draft and publish security policies' },
    { code: 'policy.acknowledge', name: 'Acknowledge Policies', module: 'Governance', description: 'Digitally acknowledge security policies' },

    { code: 'settings.manage', name: 'Manage System Settings', module: 'System', description: 'Configure global security settings' }
  ];

  const permissions = await Promise.all(
    permissionsList.map((permission) =>
      prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          module: permission.module,
          description: permission.description
        },
        create: permission
      })
    )
  );

  console.log(`Seeded ${permissions.length} permissions.`);

  
  const rolesData = [
    {
      name: 'ADMIN',
      displayName: 'Organization Administrator',
      description: 'Manages organizational accounts and system configuration. Cannot approve own privileged requests.',
      isPrivileged: true
    },
    {
      name: 'SECURITY_OFFICER',
      displayName: 'Security Officer',
      description: 'Oversees security events, incidents, risks, audits and independently approves privileged requests.',
      isPrivileged: true
    },
    {
      name: 'DEPARTMENT_MANAGER',
      displayName: 'Department Manager',
      description: 'Manages departmental users and submits role change requests.',
      isPrivileged: false
    },
    {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Standard organization member with least-privilege access.',
      isPrivileged: false
    }
  ];

  const roles = await Promise.all(
    rolesData.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {
          displayName: role.displayName,
          description: role.description,
          isPrivileged: role.isPrivileged
        },
        create: role
      })
    )
  );

  // 4. Role-Permission Assignments
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      'user.create', 'user.read', 'user.update', 'user.delete', 'user.status',
      'role.read', 'role.assign', 'role.request', 'access.review',
      'audit.read', 'audit.export',
      'alert.read', 'alert.manage',
      'backup.create', 'backup.restore', 'backup.delete',
      'incident.create', 'incident.read', 'incident.manage',
      'risk.create', 'risk.manage',
      'policy.manage', 'policy.acknowledge',
      'settings.manage'
    ],

    SECURITY_OFFICER: [
      'user.read', 'role.read', 'role.approve', 'role.request', 'access.review',
      'audit.read', 'audit.verify', 'audit.export',
      'alert.read', 'alert.manage',
      'incident.create', 'incident.read', 'incident.manage',
      'risk.create', 'risk.manage',
      'policy.manage', 'policy.acknowledge',
      'settings.manage'
    ],

    DEPARTMENT_MANAGER: [
      'user.read', 'role.read', 'role.request',
      'incident.create', 'incident.read',
      'policy.acknowledge'
    ],

    EMPLOYEE: [
      'role.request',
      'incident.create',
      'policy.acknowledge'
    ]
  };

  for (const role of roles) {
    const codes = rolePermissions[role.name] || [];

    for (const code of codes) {
      const permission = permissions.find((item) => item.code === code);

      if (!permission) {
        throw new Error(`Permission not found: ${code}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  console.log('Role-permission mappings created.');

  // 5. Security Policies
  const policies = [
    {
      code: 'POL-SEC-001',
      title: 'Enterprise Acceptable Use Policy',
      category: 'Governance',
      version: '1.2',
      content: 'This policy outlines the acceptable use of computer systems, networks, and communication channels within SecureOrg. All authenticated users must uphold data confidentiality, avoid credential sharing, and lock workstations when unattended.'
    },
    {
      code: 'POL-SEC-002',
      title: 'Password & Authentication Security Standard',
      category: 'Access Control',
      version: '2.0',
      content: 'All passwords must contain a minimum of 12 characters. Multi-factor authentication is mandatory for privileged administrative accounts.'
    },
    {
      code: 'POL-SEC-003',
      title: 'Incident Detection & Response Procedure',
      category: 'Incident Response',
      version: '1.0',
      content: 'Any observed security anomaly, unauthorized privilege escalation, or suspected compromised credential must be reported promptly to the Security Operations Center.'
    },
    {
      code: 'POL-SEC-004',
      title: 'Data Classification and Handling Standard',
      category: 'Data Protection',
      version: '1.1',
      content: 'Organizational data is classified into Public, Internal, Confidential, and Restricted tiers. Passwords, cryptographic keys, and MFA secrets are designated as Restricted and must be encrypted at rest.'
    }
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { code: policy.code },
      update: {
        title: policy.title,
        category: policy.category,
        version: policy.version,
        content: policy.content
      },
      create: policy
    });
  }

  console.log('Seeded security policies.');

  // 6. System Settings
  const settings = [
    {
      key: 'auth.maxLoginAttempts',
      value: '5',
      category: 'SECURITY',
      description: 'Failed password attempts before lockout'
    },
    {
      key: 'auth.lockoutDurationMinutes',
      value: '15',
      category: 'SECURITY',
      description: 'Temporary lockout duration in minutes'
    },
    {
      key: 'auth.passwordMinLength',
      value: '12',
      category: 'SECURITY',
      description: 'Minimum required password length'
    },
    {
      key: 'auth.sessionIdleTimeoutMinutes',
      value: '30',
      category: 'SECURITY',
      description: 'Idle session expiration time'
    },
    {
      key: 'backup.retentionDays',
      value: '30',
      category: 'RESILIENCE',
      description: 'Backup file retention window in days'
    },
    {
      key: 'backup.rpoHours',
      value: '24',
      category: 'RESILIENCE',
      description: 'Recovery Point Objective in hours'
    },
    {
      key: 'backup.rtoHours',
      value: '4',
      category: 'RESILIENCE',
      description: 'Recovery Time Objective in hours'
    }
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        category: setting.category,
        description: setting.description
      },
      create: setting
    });
  }

  console.log('Seeded system settings.');
  console.log('--- SecureOrg baseline seeding complete ---');
}

main()
  .catch((error) => {
    console.error('Error during baseline seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
