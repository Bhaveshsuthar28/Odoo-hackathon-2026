import { FastifyPluginAsync } from 'fastify';
import { prisma, InvoiceStatus } from '@subflow/database';
import PDFDocument from 'pdfkit';
import { createAuditLog } from '../../utils/audit.js';

export const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  // List invoices
  fastify.get('/', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { status, customerId, search } = request.query as any;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return reply.send({ success: true, data: { invoices } });
  });

  // Get invoice details
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        lines: { include: { product: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    // Role check: if customer, must own this invoice
    if (request.user.role === 'CUSTOMER' && invoice.customer.userId !== request.user.id && invoice.customerId !== request.user.customerId) {
      return reply.status(403).send({ success: false, message: 'Access denied to this invoice' });
    }

    return reply.send({ success: true, data: { invoice } });
  });

  // Confirm invoice
  fastify.post('/:id/confirm', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CONFIRMED },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'INVOICE_CONFIRMED',
      entity: 'Invoice',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Invoice confirmed successfully', data: { invoice } });
  });

  // Cancel invoice
  fastify.post('/:id/cancel', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    // Safeguard: Do not cancel an invoice that has payments recorded
    const completedPayments = invoice.payments.filter((p) => p.status === 'COMPLETED');
    if (completedPayments.length > 0) {
      return reply.status(400).send({
        success: false,
        message: 'Cannot cancel invoice with recorded payments. Please refund or reconcile payments first.',
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'INVOICE_CANCELLED',
      entity: 'Invoice',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Invoice cancelled', data: { invoice: updated } });
  });

  // Generate & Stream Invoice PDF with PDFKit
  fastify.get('/:id/pdf', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        lines: true,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    if (request.user.role === 'CUSTOMER' && invoice.customer.userId !== request.user.id && invoice.customerId !== request.user.customerId) {
      return reply.status(403).send({ success: false, message: 'Access denied' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);

    // Brand Header
    doc.fillColor('#714B67').fontSize(26).text('SUBFLOW', 50, 50, { characterSpacing: 2 });
    doc.fillColor('#737373').fontSize(9).text('Every Subscription. Every Payment. Every Invoice.', 50, 80);

    // Invoice Meta Top-Right
    doc.fillColor('#252525').fontSize(16).text('TAX INVOICE', 350, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#737373').text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 72, { align: 'right' });
    doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 350, 88, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 104, { align: 'right' });
    doc.text(`Status: ${invoice.status}`, 350, 120, { align: 'right' });

    doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#E5E7EB').stroke();

    // Customer & Seller Information
    doc.fontSize(11).fillColor('#714B67').text('Billed To:', 50, 155);
    doc.fontSize(10).fillColor('#252525').text(invoice.customer.name, 50, 172);
    if (invoice.customer.company) doc.text(invoice.customer.company, 50, 186);
    if (invoice.customer.addressLine1) doc.text(invoice.customer.addressLine1, 50, 200);
    doc.text(`${invoice.customer.city || ''}, ${invoice.customer.state || ''} ${invoice.customer.postalCode || ''}`, 50, 214);
    if (invoice.customer.taxId) doc.text(`GSTIN/Tax ID: ${invoice.customer.taxId}`, 50, 228);

    doc.fontSize(11).fillColor('#714B67').text('Issued By:', 350, 155);
    doc.fontSize(10).fillColor('#252525').text('SubFlow Technologies Pvt Ltd', 350, 172);
    doc.text('GSTIN: 29AAACS1234F1Z9', 350, 186);
    doc.text('support@subflow.io | www.subflow.io', 350, 200);

    // Items Table Header
    const tableTop = 260;
    doc.rect(50, tableTop, 500, 24).fill('#F7F7F8');
    doc.fillColor('#55364E').fontSize(9).text('DESCRIPTION', 60, tableTop + 7);
    doc.text('QTY', 290, tableTop + 7, { align: 'center', width: 40 });
    doc.text('RATE (₹)', 340, tableTop + 7, { align: 'right', width: 60 });
    doc.text('TAX (18%)', 410, tableTop + 7, { align: 'right', width: 60 });
    doc.text('TOTAL (₹)', 480, tableTop + 7, { align: 'right', width: 60 });

    let currentY = tableTop + 30;
    invoice.lines.forEach((line) => {
      doc.fillColor('#252525').fontSize(9).text(line.description, 60, currentY, { width: 220 });
      doc.text(String(line.quantity), 290, currentY, { align: 'center', width: 40 });
      doc.text(Number(line.unitPrice).toFixed(2), 340, currentY, { align: 'right', width: 60 });
      doc.text(Number(line.taxPercent).toFixed(0) + '%', 410, currentY, { align: 'right', width: 60 });
      doc.text(Number(line.total).toFixed(2), 480, currentY, { align: 'right', width: 60 });
      currentY += 24;
    });

    doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).strokeColor('#E5E7EB').stroke();

    // Summary calculations
    const summaryY = currentY + 20;
    doc.fontSize(10).fillColor('#737373').text('Subtotal:', 340, summaryY, { align: 'right', width: 100 });
    doc.fillColor('#252525').text(`₹${Number(invoice.subtotal).toFixed(2)}`, 450, summaryY, { align: 'right', width: 90 });

    if (Number(invoice.discountAmount) > 0) {
      doc.fillColor('#737373').text('Discount:', 340, summaryY + 16, { align: 'right', width: 100 });
      doc.fillColor('#16A34A').text(`-₹${Number(invoice.discountAmount).toFixed(2)}`, 450, summaryY + 16, { align: 'right', width: 90 });
    }

    doc.fillColor('#737373').text('Tax (GST):', 340, summaryY + 32, { align: 'right', width: 100 });
    doc.fillColor('#252525').text(`₹${Number(invoice.taxAmount).toFixed(2)}`, 450, summaryY + 32, { align: 'right', width: 90 });

    doc.rect(340, summaryY + 50, 200, 28).fill('#55364E');
    doc.fillColor('#FFFFFF').fontSize(11).text('Total Amount:', 350, summaryY + 58);
    doc.text(`₹${Number(invoice.totalAmount).toFixed(2)}`, 440, summaryY + 58, { align: 'right', width: 90 });

    doc.fillColor('#737373').fontSize(9).text('Amount Paid:', 340, summaryY + 86, { align: 'right', width: 100 });
    doc.fillColor('#252525').text(`₹${Number(invoice.amountPaid).toFixed(2)}`, 450, summaryY + 86, { align: 'right', width: 90 });

    doc.fillColor('#737373').fontSize(10).text('Outstanding Balance:', 320, summaryY + 102, { align: 'right', width: 120 });
    doc.fillColor('#DC2626').text(`₹${Number(invoice.outstandingAmount).toFixed(2)}`, 450, summaryY + 102, { align: 'right', width: 90 });

    // Footer
    doc.fontSize(8).fillColor('#9CA3AF').text('Thank you for choosing SubFlow. This is a computer-generated tax invoice and requires no physical signature.', 50, 750, { align: 'center', width: 500 });

    doc.end();
    return reply.send(doc);
  });
};
