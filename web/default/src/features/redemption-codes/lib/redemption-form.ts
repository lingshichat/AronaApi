import { z } from 'zod'
import type { TFunction } from 'i18next'
import { parseQuotaFromDollars, quotaUnitsToDollars } from '@/lib/format'
import {
  REDEMPTION_VALIDATION,
  getRedemptionFormErrorMessages,
} from '../constants'
import { type RedemptionFormData, type Redemption } from '../types'

// ============================================================================
// Form Schema (use getRedemptionFormSchema(t) in components for i18n messages)
// ============================================================================

export function getRedemptionFormSchema(t: TFunction) {
  const msg = getRedemptionFormErrorMessages(t)
  return z
    .object({
      type: z.enum(['quota', 'subscription']),
      name: z
        .string()
        .min(REDEMPTION_VALIDATION.NAME_MIN_LENGTH, msg.NAME_LENGTH_INVALID)
        .max(REDEMPTION_VALIDATION.NAME_MAX_LENGTH, msg.NAME_LENGTH_INVALID),
      quota_dollars: z.number().min(0, t('Quota must be a positive number')),
      plan_id: z.number().optional(),
      expired_time: z.date().optional(),
      count: z
        .number()
        .min(REDEMPTION_VALIDATION.COUNT_MIN, msg.COUNT_INVALID)
        .max(REDEMPTION_VALIDATION.COUNT_MAX, msg.COUNT_INVALID)
        .optional(),
    })
    .superRefine((value, ctx) => {
      if (value.type === 'quota' && value.quota_dollars <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quota_dollars'],
          message: t('Quota must be a positive number'),
        })
      }
      if (value.type === 'subscription' && !value.plan_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['plan_id'],
          message: t('Please select a subscription plan'),
        })
      }
    })
}

export type RedemptionFormValues = {
  type: 'quota' | 'subscription'
  name: string
  quota_dollars: number
  plan_id?: number
  expired_time?: Date
  count?: number
}

// ============================================================================
// Form Defaults
// ============================================================================

export const REDEMPTION_FORM_DEFAULT_VALUES: RedemptionFormValues = {
  type: 'quota',
  name: '',
  quota_dollars: 10,
  plan_id: undefined,
  expired_time: undefined,
  count: 1,
}

// ============================================================================
// Form Data Transformation
// ============================================================================

/**
 * Transform form data to API payload
 */
export function transformFormDataToPayload(
  data: RedemptionFormValues
): RedemptionFormData {
  return {
    name: data.name,
    type: data.type,
    quota:
      data.type === 'quota' ? parseQuotaFromDollars(data.quota_dollars) : 0,
    plan_id: data.type === 'subscription' ? data.plan_id || 0 : 0,
    expired_time: data.expired_time
      ? Math.floor(data.expired_time.getTime() / 1000)
      : 0,
    count: data.count || 1,
  }
}

/**
 * Transform redemption data to form defaults
 */
export function transformRedemptionToFormDefaults(
  redemption: Redemption
): RedemptionFormValues {
  return {
    type: redemption.type || 'quota',
    name: redemption.name,
    quota_dollars: quotaUnitsToDollars(redemption.quota),
    plan_id: redemption.plan_id || undefined,
    expired_time:
      redemption.expired_time > 0
        ? new Date(redemption.expired_time * 1000)
        : undefined,
    count: 1,
  }
}
