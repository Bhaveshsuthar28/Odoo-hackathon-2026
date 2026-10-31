import { PrismaClient, Role, CustomerStatus, ProductType, ProductStatus, PlanInterval, PlanStatus, SubscriptionStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SubFlow database seeding...');

  // Clean existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentRecovery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.discountApplication.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.planItem.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.billingExecution.deleteMany();

  console.log('✅ Cleaned up old database records');

  // Password hashes
  const adminHash = await bcrypt.hash('SubFlow@Admin2026!', 10);
  const staffHash = await bcrypt.hash('SubFlow@Staff2026!', 10);
  const customerHash = await bcrypt.hash('Customer@SubFlow2026!', 10);

  // 1. Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@subflow.io',
      passwordHash: adminHash,
      name: 'Alexander Wright',
      role: Role.ADMIN,
      phone: '+91 98765 43210',
    },
  });

  const staffUser1 = await prisma.user.create({
    data: {
      email: 'sarah.ops@subflow.io',
      passwordHash: staffHash,
      name: 'Sarah Jenkins',
      role: Role.STAFF,
      phone: '+91 98765 43211',
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      email: 'david.finance@subflow.io',
      passwordHash: staffHash,
      name: 'David Patel',
      role: Role.STAFF,
      phone: '+91 98765 43212',
    },
  });

  const customerUser1 = await prisma.user.create({
    data: {
      email: 'john@acmecorp.com',
      passwordHash: customerHash,
      name: 'John Miller',
      role: Role.CUSTOMER,
      phone: '+91 98220 11223',
    },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      email: 'priya@techstart.io',
      passwordHash: customerHash,
      name: 'Priya Sharma',
      role: Role.CUSTOMER,
      phone: '+91 98220 44556',
    },
  });

  console.log('✅ Created initial Users (Admin, Staff, Customer)');

  // 2. Customers
  const customer1 = await prisma.customer.create({
    data: {
      userId: customerUser1.id,
      customerNumber: 'CUST-0001',
      name: 'Acme Corporation',
      email: 'billing@acmecorp.com',
      phone: '+91 98220 11223',
      company: 'Acme Technologies Pvt Ltd',
      addressLine1: 'Tech Park Avenue, 4th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      country: 'India',
      taxId: '29ABCDE1234F1Z5',
      status: CustomerStatus.ACTIVE,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: customerUser2.id,
      customerNumber: 'CUST-0002',
      name: 'TechStart Global',
      email: 'accounts@techstart.io',
      phone: '+91 98220 44556',
      company: 'TechStart Solutions Inc',
      addressLine1: '88 Innovation Boulevard',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411057',
      country: 'India',
      taxId: '27AABCT9876Q1Z2',
      status: CustomerStatus.ACTIVE,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerNumber: 'CUST-0003',
      name: 'Zenith Logistics',
      email: 'finance@zenithlogistics.in',
      phone: '+91 98220 77889',
      company: 'Zenith Freight & Cargo Ltd',
      addressLine1: 'Port Road 12',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      taxId: '27AAACZ3344R1Z8',
      status: CustomerStatus.ACTIVE,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerNumber: 'CUST-0004',
      name: 'Nova Cloud Systems',
      email: 'ops@novacloud.co',
      phone: '+91 98220 99001',
      company: 'Nova Cloud Pvt Ltd',
      addressLine1: 'Cyber Towers Sector 5',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      country: 'India',
      taxId: '36AAACN5566K1Z9',
      status: CustomerStatus.ACTIVE,
    },
  });

  console.log('✅ Created Customers');

  // 3. Tax Rules
  await prisma.taxRule.createMany({
    data: [
      { name: 'GST Standard (18%)', rate: 18.00, taxType: 'PERCENTAGE', isDefault: true, isActive: true },
      { name: 'GST Reduced (12%)', rate: 12.00, taxType: 'PERCENTAGE', isDefault: false, isActive: true },
      { name: 'Zero Tax (0%)', rate: 0.00, taxType: 'PERCENTAGE', isDefault: false, isActive: true },
    ],
  });

  // 4. Products & Variants
  const cloudPlatform = await prisma.product.create({
    data: {
      name: 'Cloud Hosting Platform',
      code: 'PRD-HOST-01',
      type: ProductType.SERVICE,
      salesPrice: 4999.00,
      costPrice: 1500.00,
      description: 'Fully managed enterprise cloud compute and storage environment with 99.99% uptime guarantee.',
      status: ProductStatus.ACTIVE,
      variants: {
        create: [
          { variantName: 'High Compute Tier', brand: 'SubFlow Cloud', additionalPrice: 2000.00, sku: 'HOST-01-HC' },
          { variantName: 'High Memory Tier', brand: 'SubFlow Cloud', additionalPrice: 3500.00, sku: 'HOST-01-HM' },
        ],
      },
    },
    include: { variants: true },
  });

  const securitySuite = await prisma.product.create({
    data: {
      name: 'Enterprise Security Suite',
      code: 'PRD-SEC-02',
      type: ProductType.SERVICE,
      salesPrice: 2999.00,
      costPrice: 800.00,
      description: 'Zero-trust architecture, automated vulnerability scanning and audit compliance reporting.',
      status: ProductStatus.ACTIVE,
      variants: {
        create: [
          { variantName: 'SOC2 Compliance Addon', brand: 'SubFlow Sec', additionalPrice: 1500.00, sku: 'SEC-02-SOC' },
        ],
      },
    },
    include: { variants: true },
  });

  const apiGateway = await prisma.product.create({
    data: {
      name: 'API Gateway & Rate Limiter',
      code: 'PRD-API-03',
      type: ProductType.SERVICE,
      salesPrice: 1499.00,
      costPrice: 400.00,
      description: 'Ultra-low latency edge gateway with automated token validation, rate-limiting and analytics.',
      status: ProductStatus.ACTIVE,
    },
  });

  console.log('✅ Created Products & Product Variants');

  // 5. Plans
  const starterMonthlyPlan = await prisma.plan.create({
    data: {
      name: 'Starter Business Monthly',
      code: 'PLAN-START-M',
      description: 'Essential billing and compute suite for growing companies.',
      billingInterval: PlanInterval.MONTHLY,
      price: 4999.00,
      currency: 'INR',
      minQuantity: 1,
      status: PlanStatus.ACTIVE,
      productId: cloudPlatform.id,
      items: {
        create: [
          { productId: cloudPlatform.id, quantity: 1, unitPrice: 4999.00 },
        ],
      },
    },
  });

  const proMonthlyPlan = await prisma.plan.create({
    data: {
      name: 'Pro Enterprise Monthly',
      code: 'PLAN-PRO-M',
      description: 'Complete high-performance infrastructure with bundled security suite.',
      billingInterval: PlanInterval.MONTHLY,
      price: 7998.00,
      currency: 'INR',
      minQuantity: 1,
      status: PlanStatus.ACTIVE,
      productId: cloudPlatform.id,
      items: {
        create: [
          { productId: cloudPlatform.id, quantity: 1, unitPrice: 4999.00 },
          { productId: securitySuite.id, quantity: 1, unitPrice: 2999.00 },
        ],
      },
    },
  });

  const enterpriseYearlyPlan = await prisma.plan.create({
    data: {
      name: 'Enterprise Suite Annual',
      code: 'PLAN-ENT-Y',
      description: 'All-inclusive annual plan with 2 months free discount included.',
      billingInterval: PlanInterval.YEARLY,
      price: 79990.00,
      currency: 'INR',
      minQuantity: 1,
      status: PlanStatus.ACTIVE,
      productId: cloudPlatform.id,
      items: {
        create: [
          { productId: cloudPlatform.id, quantity: 1, unitPrice: 49990.00 },
          { productId: securitySuite.id, quantity: 1, unitPrice: 20000.00 },
          { productId: apiGateway.id, quantity: 1, unitPrice: 10000.00 },
        ],
      },
    },
  });

  console.log('✅ Created Plans');

  // 6. Discounts
  const launchDiscount = await prisma.discount.create({
    data: {
      code: 'LAUNCH20',
      name: 'Launch Promotion 20%',
      discountType: 'PERCENTAGE',
      value: 20.00,
      minPurchaseAmount: 3000.00,
      isSubscriptionWide: true,
      isActive: true,
    },
  });

  await prisma.discount.create({
    data: {
      code: 'FLAT1000',
      name: 'Flat ₹1,000 Off Enterprise',
      discountType: 'FIXED',
      value: 1000.00,
      minPurchaseAmount: 5000.00,
      isSubscriptionWide: true,
      isActive: true,
    },
  });

  console.log('✅ Created Discounts');

  // 7. Subscriptions
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const sub1 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0001',
      customerId: customer1.id,
      planId: proMonthlyPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(2026, 0, 1),
      nextBillingDate: nextMonth,
      billingInterval: PlanInterval.MONTHLY,
      paymentTerms: 'Net 15',
      subtotal: 7998.00,
      discountAmount: 1599.60,
      taxAmount: 1151.71,
      totalAmount: 7550.11,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            quantity: 1,
            unitPrice: 4999.00,
            discountPercent: 20.00,
            taxPercent: 18.00,
            subtotal: 4999.00,
            total: 4719.06,
          },
          {
            productId: securitySuite.id,
            quantity: 1,
            unitPrice: 2999.00,
            discountPercent: 20.00,
            taxPercent: 18.00,
            subtotal: 2999.00,
            total: 2831.05,
          },
        ],
      },
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0002',
      customerId: customer2.id,
      planId: starterMonthlyPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(2026, 1, 1),
      nextBillingDate: new Date(), // Due today! Test for billing engine
      billingInterval: PlanInterval.MONTHLY,
      paymentTerms: 'Due on Receipt',
      subtotal: 4999.00,
      discountAmount: 0.00,
      taxAmount: 899.82,
      totalAmount: 5898.82,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            quantity: 1,
            unitPrice: 4999.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 4999.00,
            total: 5898.82,
          },
        ],
      },
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0003',
      customerId: customer3.id,
      planId: enterpriseYearlyPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(2026, 0, 15),
      nextBillingDate: new Date(2027, 0, 15),
      billingInterval: PlanInterval.YEARLY,
      paymentTerms: 'Net 30',
      subtotal: 79990.00,
      discountAmount: 0.00,
      taxAmount: 14398.20,
      totalAmount: 94388.20,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            quantity: 1,
            unitPrice: 49990.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 49990.00,
            total: 58988.20,
          },
          {
            productId: securitySuite.id,
            quantity: 1,
            unitPrice: 20000.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 20000.00,
            total: 23600.00,
          },
          {
            productId: apiGateway.id,
            quantity: 1,
            unitPrice: 10000.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 10000.00,
            total: 11800.00,
          },
        ],
      },
    },
  });

  console.log('✅ Created Subscriptions');

  // 8. Invoices
  // Invoice 1: PAID invoice for Customer 1
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      customerId: customer1.id,
      subscriptionId: sub1.id,
      billingPeriodStart: new Date(2026, 0, 1),
      billingPeriodEnd: new Date(2026, 1, 1),
      invoiceDate: new Date(2026, 0, 1),
      dueDate: new Date(2026, 0, 15),
      subtotal: 7998.00,
      discountAmount: 1599.60,
      taxAmount: 1151.71,
      totalAmount: 7550.11,
      amountPaid: 7550.11,
      outstandingAmount: 0.00,
      status: InvoiceStatus.PAID,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            description: 'Cloud Hosting Platform (Monthly)',
            quantity: 1,
            unitPrice: 4999.00,
            discountPercent: 20.00,
            taxPercent: 18.00,
            subtotal: 4999.00,
            total: 4719.06,
          },
          {
            productId: securitySuite.id,
            description: 'Enterprise Security Suite (Monthly)',
            quantity: 1,
            unitPrice: 2999.00,
            discountPercent: 20.00,
            taxPercent: 18.00,
            subtotal: 2999.00,
            total: 2831.05,
          },
        ],
      },
    },
  });

  // Payment for Invoice 1
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0001',
      invoiceId: inv1.id,
      customerId: customer1.id,
      paymentMethod: PaymentMethod.CARD,
      amount: 7550.11,
      paymentDate: new Date(2026, 0, 5),
      reference: 'TXN_CARD_998124',
      status: PaymentStatus.COMPLETED,
      note: 'Auto-charged credit card via customer portal',
    },
  });

  // Invoice 2: OVERDUE invoice for Customer 3
  const overdueDueDate = new Date();
  overdueDueDate.setDate(overdueDueDate.getDate() - 12);
  const overdueStartDate = new Date(overdueDueDate);
  overdueStartDate.setDate(overdueStartDate.getDate() - 30);

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      customerId: customer3.id,
      billingPeriodStart: overdueStartDate,
      billingPeriodEnd: overdueDueDate,
      invoiceDate: overdueStartDate,
      dueDate: overdueDueDate,
      subtotal: 15000.00,
      discountAmount: 0.00,
      taxAmount: 2700.00,
      totalAmount: 17700.00,
      amountPaid: 5000.00,
      outstandingAmount: 12700.00,
      status: InvoiceStatus.OVERDUE,
      notes: 'Initial deposit received; balance pending bank transfer clearance',
      lines: {
        create: [
          {
            productId: securitySuite.id,
            description: 'Security Audit & Zero Trust Onboarding',
            quantity: 1,
            unitPrice: 15000.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 15000.00,
            total: 17700.00,
          },
        ],
      },
    },
  });

  // Partial payment for Invoice 2
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0002',
      invoiceId: inv2.id,
      customerId: customer3.id,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      amount: 5000.00,
      paymentDate: overdueStartDate,
      reference: 'NEFT_982181726',
      status: PaymentStatus.COMPLETED,
      note: 'Part payment 5000 received',
    },
  });

  // Failed payment attempt for Invoice 2 (for Feature 1 Leakage & Feature 3 Recovery)
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0003',
      invoiceId: inv2.id,
      customerId: customer3.id,
      paymentMethod: PaymentMethod.CARD,
      amount: 12700.00,
      paymentDate: new Date(),
      reference: 'TXN_FAIL_00192',
      status: PaymentStatus.FAILED,
      failureReason: 'Card issuer declined: Insufficient funds in corporate account',
    },
  });

  // Register in PaymentRecovery table
  await prisma.paymentRecovery.create({
    data: {
      invoiceId: inv2.id,
      customerId: customer3.id,
      amount: 12700.00,
      retryCount: 1,
      maxRetries: 3,
      nextRetryDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      status: 'PENDING',
      lastError: 'Card issuer declined: Insufficient funds',
    },
  });

  // Invoice 3: CONFIRMED (Unpaid / Open) for Customer 4
  const futureDue = new Date();
  futureDue.setDate(futureDue.getDate() + 10);
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      customerId: customer4.id,
      billingPeriodStart: new Date(),
      billingPeriodEnd: futureDue,
      invoiceDate: new Date(),
      dueDate: futureDue,
      subtotal: 4999.00,
      discountAmount: 0.00,
      taxAmount: 899.82,
      totalAmount: 5898.82,
      amountPaid: 0.00,
      outstandingAmount: 5898.82,
      status: InvoiceStatus.CONFIRMED,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            description: 'Cloud Platform Standard Tier',
            quantity: 1,
            unitPrice: 4999.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 4999.00,
            total: 5898.82,
          },
        ],
      },
    },
  });

  console.log('✅ Created Invoices and Payments (Paid, Overdue, Confirmed, Partial, Failed)');

  // 9. Quotation
  const quoteValidity = new Date();
  quoteValidity.setDate(quoteValidity.getDate() + 30);
  await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0001',
      customerId: customer4.id,
      status: 'SENT',
      validityDate: quoteValidity,
      subtotal: 9497.00,
      taxAmount: 1709.46,
      discountAmount: 0.00,
      totalAmount: 11206.46,
      termsAndConditions: 'Standard 30 days validity. 18% GST applicable. Net 15 days payment terms.',
      notes: 'Custom deployment package with bundled edge gateway.',
      createdById: staffUser1.id,
      lines: {
        create: [
          {
            productId: cloudPlatform.id,
            description: 'Cloud Hosting Platform',
            quantity: 1,
            unitPrice: 4999.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 4999.00,
            total: 5898.82,
          },
          {
            productId: securitySuite.id,
            description: 'Enterprise Security Suite',
            quantity: 1,
            unitPrice: 2999.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 2999.00,
            total: 3538.82,
          },
          {
            productId: apiGateway.id,
            description: 'API Gateway & Rate Limiter',
            quantity: 1,
            unitPrice: 1499.00,
            discountPercent: 0.00,
            taxPercent: 18.00,
            subtotal: 1499.00,
            total: 1768.82,
          },
        ],
      },
    },
  });

  console.log('✅ Created Quotation');

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'SYSTEM_INITIALIZED',
        entity: 'System',
        details: { message: 'Database schema created and demo environment initialized' },
      },
      {
        actorId: staffUser1.id,
        actorEmail: staffUser1.email,
        actorRole: 'STAFF',
        action: 'QUOTATION_CREATED',
        entity: 'Quotation',
        entityId: 'QT-2026-0001',
        details: { totalAmount: 11206.46, customer: 'Nova Cloud Systems' },
      },
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'SUBSCRIPTION_ACTIVATED',
        entity: 'Subscription',
        entityId: sub1.id,
        details: { plan: 'Pro Enterprise Monthly', customer: 'Acme Corporation' },
      },
    ],
  });

  console.log('✅ Created Initial Audit Logs');
  console.log('🎉 SubFlow Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
