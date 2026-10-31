import { prisma } from '@subflow/database';

export interface AuditLogParams {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details || {},
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
