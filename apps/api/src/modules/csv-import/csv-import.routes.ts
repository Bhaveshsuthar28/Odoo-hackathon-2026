import { FastifyPluginAsync } from 'fastify';
import { prisma, CustomerStatus } from '@subflow/database';
import { parse } from 'csv-parse/sync';
import { createAuditLog } from '../../utils/audit.js';

export const csvImportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  // Preview & Validate CSV Data
  fastify.post('/preview', async (request, reply) => {
    const { csvContent } = (request.body as any) || {};

    if (!csvContent) {
      return reply.status(400).send({ success: false, message: 'csvContent is required' });
    }

    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const validRows: any[] = [];
      const errorRows: any[] = [];
      const duplicateRows: any[] = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 2; // header is row 1

        if (!row.name || !row.email) {
          errorRows.push({
            row: rowNum,
            data: row,
            error: 'Missing required fields: name and email are mandatory',
          });
          continue;
        }

        // Email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errorRows.push({
            row: rowNum,
            data: row,
            error: 'Invalid email format',
          });
          continue;
        }

        // Check if customer email already exists in DB
        const existing = await prisma.customer.findUnique({
          where: { email: row.email },
        });

        if (existing) {
          duplicateRows.push({
            row: rowNum,
            email: row.email,
            name: row.name,
            reason: 'Email already exists in database',
          });
        } else {
          validRows.push({
            name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            city: row.city || null,
            state: row.state || null,
            taxId: row.taxId || null,
          });
        }
      }

      return reply.send({
        success: true,
        data: {
          totalRows: records.length,
          validCount: validRows.length,
          errorCount: errorRows.length,
          duplicateCount: duplicateRows.length,
          previewRows: validRows.slice(0, 5),
          errors: errorRows,
          duplicates: duplicateRows,
        },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: `CSV parsing failed: ${err.message}`,
      });
    }
  });

  // Execute CSV Import
  fastify.post('/execute', async (request, reply) => {
    const { rows } = (request.body as any) || {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return reply.status(400).send({ success: false, message: 'rows array is required' });
    }

    let importedCount = 0;
    const errors: any[] = [];

    const existingCount = await prisma.customer.count();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const customerNumber = `CUST-${String(existingCount + importedCount + 1).padStart(4, '0')}`;
        await prisma.customer.create({
          data: {
            customerNumber,
            name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            city: row.city || null,
            state: row.state || null,
            taxId: row.taxId || null,
            status: CustomerStatus.ACTIVE,
          },
        });
        importedCount++;
      } catch (err: any) {
        errors.push({ email: row.email, error: err.message });
      }
    }

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'CSV_IMPORT_EXECUTED',
      entity: 'Customer',
      details: { importedCount, errorCount: errors.length },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: `Successfully imported ${importedCount} customers.`,
      data: {
        importedCount,
        errors,
      },
    });
  });
};
