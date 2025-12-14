/**
 * Database Seed Script
 * Populates database with realistic test data for development/demo
 * Run: npm run seed
 */

import { prisma } from './prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

/**
 * Hash password using bcrypt (same as auth service)
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
    logger.info('🌱 Starting database seed...');

    try {
        // Clear existing data in correct order (respecting foreign keys)
        logger.info('Clearing existing data...');
        await prisma.costMetric.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.alert.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.drift.deleteMany({});
        await prisma.user.deleteMany({});

        // ========== CREATE USERS ==========
        logger.info('Creating users...');

        const admin = await prisma.user.create({
            data: {
                email: 'admin@driftsentry.local',
                passwordHash: await hashPassword('admin123'),
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isActive: true,
            },
        });

        const engineer = await prisma.user.create({
            data: {
                email: 'engineer@driftsentry.local',
                passwordHash: await hashPassword('engineer123'),
                firstName: 'John',
                lastName: 'Engineer',
                role: 'engineer',
                isActive: true,
            },
        });

        const viewer = await prisma.user.create({
            data: {
                email: 'viewer@driftsentry.local',
                passwordHash: await hashPassword('viewer123'),
                firstName: 'Jane',
                lastName: 'Viewer',
                role: 'viewer',
                isActive: true,
            },
        });

        logger.info('Created users', { count: 3 });

        // ========== CREATE DRIFTS ==========
        logger.info('Creating drifts...');

        const drifts = await Promise.all([
            // Critical drift - EC2 instance type change
            prisma.drift.create({
                data: {
                    resourceId: 'i-0123456789abcdef0',
                    resourceType: 'EC2',
                    region: 'us-east-1',
                    accountId: '123456789012',
                    expectedState: {
                        instanceType: 't3.medium',
                        vpcId: 'vpc-12345678',
                        securityGroups: ['sg-12345678'],
                        tags: { Environment: 'production', Team: 'platform' },
                    },
                    actualState: {
                        instanceType: 't3.large',
                        vpcId: 'vpc-12345678',
                        securityGroups: ['sg-87654321'],
                        tags: { Environment: 'production', Team: 'platform' },
                    },
                    difference: {
                        instanceType: { expected: 't3.medium', actual: 't3.large' },
                        securityGroups: { expected: ['sg-12345678'], actual: ['sg-87654321'] },
                    },
                    severity: 'critical',
                    costImpactMonthly: 125.50,
                    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    detectedBy: 'scheduler',
                    status: 'detected',
                },
            }),

            // Warning drift - RDS Multi-AZ disabled
            prisma.drift.create({
                data: {
                    resourceId: 'rds-prod-db-01',
                    resourceType: 'RDS',
                    region: 'eu-west-1',
                    accountId: '123456789012',
                    expectedState: {
                        multiAZ: true,
                        dbInstanceClass: 'db.t3.large',
                        engine: 'postgres',
                        engineVersion: '14.7',
                    },
                    actualState: {
                        multiAZ: false,
                        dbInstanceClass: 'db.t3.large',
                        engine: 'postgres',
                        engineVersion: '14.7',
                    },
                    difference: {
                        multiAZ: { expected: true, actual: false },
                    },
                    severity: 'warning',
                    costImpactMonthly: 45.00,
                    detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
                    detectedBy: 'scheduler',
                    status: 'triaged',
                },
            }),

            // Approved drift - S3 versioning
            prisma.drift.create({
                data: {
                    resourceId: 's3-bucket-logs',
                    resourceType: 'S3',
                    region: 'us-west-2',
                    accountId: '123456789012',
                    expectedState: {
                        versioning: 'Enabled',
                        publicAccess: false,
                    },
                    actualState: {
                        versioning: 'Suspended',
                        publicAccess: false,
                    },
                    difference: {
                        versioning: { expected: 'Enabled', actual: 'Suspended' },
                    },
                    severity: 'info',
                    costImpactMonthly: 0,
                    detectedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
                    detectedBy: 'manual',
                    status: 'approved',
                    approvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                    approvedBy: engineer.id,
                    approvalReason: 'Intentional configuration change for cost savings',
                },
            }),

            // Critical drift - Security Group open to internet
            prisma.drift.create({
                data: {
                    resourceId: 'sg-0987654321',
                    resourceType: 'SECURITY_GROUP',
                    region: 'us-east-1',
                    accountId: '123456789012',
                    expectedState: {
                        inboundRules: [
                            { port: 443, protocol: 'tcp', source: '10.0.0.0/8' },
                        ],
                    },
                    actualState: {
                        inboundRules: [
                            { port: 443, protocol: 'tcp', source: '0.0.0.0/0' },
                        ],
                    },
                    difference: {
                        'inboundRules[0].source': { expected: '10.0.0.0/8', actual: '0.0.0.0/0' },
                    },
                    severity: 'critical',
                    costImpactMonthly: 0,
                    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    detectedBy: 'api',
                    status: 'detected',
                },
            }),

            // Resolved drift - IAM Role policy
            prisma.drift.create({
                data: {
                    resourceId: 'role-lambda-execution',
                    resourceType: 'IAM_ROLE',
                    region: 'us-east-1',
                    accountId: '123456789012',
                    expectedState: {
                        policies: ['AWSLambdaBasicExecutionRole'],
                        trustPolicy: { Service: 'lambda.amazonaws.com' },
                    },
                    actualState: {
                        policies: ['AWSLambdaBasicExecutionRole', 'AdministratorAccess'],
                        trustPolicy: { Service: 'lambda.amazonaws.com' },
                    },
                    difference: {
                        policies: {
                            expected: ['AWSLambdaBasicExecutionRole'],
                            actual: ['AWSLambdaBasicExecutionRole', 'AdministratorAccess'],
                        },
                    },
                    severity: 'critical',
                    costImpactMonthly: 0,
                    detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    detectedBy: 'scheduler',
                    status: 'resolved',
                    rejectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                    rejectedBy: admin.id,
                    rejectionReason: 'Escalated for immediate remediation',
                    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    resolvedHow: 'manual-fix',
                },
            }),
        ]);

        logger.info('Created drifts', { count: drifts.length });

        // ========== CREATE ALERTS ==========
        logger.info('Creating alerts...');

        const alerts = await Promise.all([
            // Alert for first critical drift
            prisma.alert.create({
                data: {
                    driftId: drifts[0]!.id,
                    type: 'drift_detected',
                    severity: 'critical',
                    title: 'Critical drift: EC2 instance configuration',
                    message: 'Instance type and security groups have changed unexpectedly. Immediate review required.',
                    isRead: false,
                },
            }),

            // Alert for security group drift
            prisma.alert.create({
                data: {
                    driftId: drifts[3]!.id,
                    type: 'drift_detected',
                    severity: 'critical',
                    title: 'Security Group open to internet',
                    message: 'Security group sg-0987654321 has been modified to allow traffic from 0.0.0.0/0. This is a potential security risk.',
                    isRead: false,
                },
            }),

            // Alert for RDS warning
            prisma.alert.create({
                data: {
                    driftId: drifts[1]!.id,
                    type: 'approval_needed',
                    severity: 'warning',
                    title: 'RDS Multi-AZ disabled - review needed',
                    message: 'Production database rds-prod-db-01 has Multi-AZ disabled. This may impact availability.',
                    isRead: true,
                    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    readBy: engineer.id,
                },
            }),
        ]);

        logger.info('Created alerts', { count: alerts.length });

        // ========== CREATE AUDIT LOGS ==========
        logger.info('Creating audit logs...');

        const auditLogs = await Promise.all([
            // Drift created log
            prisma.auditLog.create({
                data: {
                    driftId: drifts[0]!.id,
                    action: 'drift_created',
                    actorEmail: 'scheduler@system',
                    newValue: { status: 'detected', severity: 'critical' },
                    details: { source: 'scheduled_scan', scanId: 'scan-001' },
                },
            }),

            // Drift approved log
            prisma.auditLog.create({
                data: {
                    driftId: drifts[2]!.id,
                    action: 'drift_approved',
                    actorId: engineer.id,
                    actorEmail: engineer.email,
                    oldValue: { status: 'detected' },
                    newValue: { status: 'approved', approvalReason: 'Intentional configuration change for cost savings' },
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                },
            }),

            // Drift resolved log
            prisma.auditLog.create({
                data: {
                    driftId: drifts[4]!.id,
                    action: 'drift_resolved',
                    actorId: admin.id,
                    actorEmail: admin.email,
                    oldValue: { status: 'rejected' },
                    newValue: { status: 'resolved', resolvedHow: 'manual-fix' },
                    details: { ticketId: 'JIRA-1234', remediationApplied: true },
                },
            }),

            // User login log
            prisma.auditLog.create({
                data: {
                    action: 'user_login',
                    actorId: admin.id,
                    actorEmail: admin.email,
                    details: { method: 'password', mfaUsed: false },
                    ipAddress: '10.0.0.1',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                },
            }),
        ]);

        logger.info('Created audit logs', { count: auditLogs.length });

        // ========== CREATE COST METRICS ==========
        logger.info('Creating cost metrics...');

        const now = new Date();
        const costMetrics = await Promise.all([
            // Cost metrics for EC2 drift
            prisma.costMetric.create({
                data: {
                    driftId: drifts[0]!.id,
                    costUsd: 125.50,
                    costProjectedMonthly: 125.50,
                    recordedAt: now,
                    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
                    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                },
            }),

            // Cost metrics for RDS drift
            prisma.costMetric.create({
                data: {
                    driftId: drifts[1]!.id,
                    costUsd: 45.00,
                    costProjectedMonthly: 45.00,
                    recordedAt: now,
                    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
                    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                },
            }),

            // Historical cost data
            prisma.costMetric.create({
                data: {
                    costUsd: 350.00,
                    costProjectedMonthly: 350.00,
                    recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                    periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                    periodEnd: new Date(now.getFullYear(), now.getMonth(), 0),
                },
            }),
        ]);

        logger.info('Created cost metrics', { count: costMetrics.length });

        // ========== SUMMARY ==========
        logger.info('✅ Database seeding complete!', {
            users: 3,
            drifts: drifts.length,
            alerts: alerts.length,
            auditLogs: auditLogs.length,
            costMetrics: costMetrics.length,
        });

        logger.info('📝 Test credentials:');
        logger.info('  Admin: admin@driftsentry.local / admin123');
        logger.info('  Engineer: engineer@driftsentry.local / engineer123');
        logger.info('  Viewer: viewer@driftsentry.local / viewer123');

    } catch (error) {
        logger.error('❌ Seeding failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed
main().catch((error: unknown) => {
    logger.error('Seed script error', { error: String(error) });
    process.exit(1);
});
