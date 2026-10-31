import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ==========================================
// Financial Calculation Helpers with Decimal.js
// ==========================================

export function calculateLineTotal(
  unitPrice: number | string | Decimal,
  quantity: number,
  discountPercent: number | string | Decimal = 0,
  taxPercent: number | string | Decimal = 18
): {
  subtotal: Decimal;
  discountAmount: Decimal;
  taxableAmount: Decimal;
  taxAmount: Decimal;
  total: Decimal;
} {
  const price = new Decimal(unitPrice);
  const qty = new Decimal(quantity);
  const discPct = new Decimal(discountPercent);
  const taxPct = new Decimal(taxPercent);

  const subtotal = price.mul(qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const discountAmount = subtotal.mul(discPct.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const taxableAmount = subtotal.minus(discountAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const taxAmount = taxableAmount.mul(taxPct.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const total = taxableAmount.plus(taxAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
}

export function calculateNextBillingDate(
  currentDate: Date,
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
): Date {
  const next = new Date(currentDate);
  switch (interval) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export function calculateBillingPeriod(
  periodStart: Date,
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
): { start: Date; end: Date } {
  const start = new Date(periodStart);
  const end = calculateNextBillingDate(start, interval);
  return { start, end };
}

// ==========================================
// Validation Schemas (Zod)
// ==========================================

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('India'),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const productVariantSchema = z.object({
  variantName: z.string().min(1),
  brand: z.string().optional(),
  additionalPrice: z.number().min(0).default(0),
  sku: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  code: z.string().min(2, 'Product code is required'),
  type: z.enum(['GOODS', 'SERVICE']).default('SERVICE'),
  salesPrice: z.number().min(0, 'Sales price cannot be negative'),
  costPrice: z.number().min(0).default(0),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  variants: z.array(productVariantSchema).optional(),
});

export const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  code: z.string().min(2, 'Plan code is required'),
  description: z.string().optional(),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().default('INR'),
  minQuantity: z.number().int().min(1).default(1),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  autoClose: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).default('ACTIVE'),
  productId: z.string().uuid().optional(),
});

export const quotationLineSchema = z.object({
  productId: z.string().uuid(),
  productVariantId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(18),
});

export const quotationSchema = z.object({
  customerId: z.string().uuid(),
  validityDays: z.number().int().min(1).default(30),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(quotationLineSchema).min(1, 'At least one line item is required'),
});

export const subscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  paymentTerms: z.string().default('Due on Receipt'),
  autoRenew: z.boolean().default(true),
  lines: z.array(
    z.object({
      productId: z.string().uuid(),
      productVariantId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
      discountPercent: z.number().min(0).max(100).default(0),
      taxPercent: z.number().min(0).max(100).default(18),
    })
  ).min(1, 'Subscription must have at least one line item'),
});

export const discountSchema = z.object({
  code: z.string().min(2, 'Discount code is required'),
  name: z.string().min(2, 'Discount name is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  value: z.number().min(0),
  minPurchaseAmount: z.number().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  startDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).nullable().optional(),
  maxUsage: z.number().int().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  isSubscriptionWide: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER', 'WALLET']).default('CARD'),
  reference: z.string().optional(),
  note: z.string().optional(),
});
