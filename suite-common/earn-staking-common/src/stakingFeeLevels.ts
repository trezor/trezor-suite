import { z } from 'zod';

import type { FeeLevel } from '@trezor/connect-common';

import { stakingAmountSchema } from './stakingAmount';

// Bitcoin's economy tier has no staking counterpart: every staking
// network composes low, normal and high, or a single normal level.
export const STAKING_FEE_LEVEL_LABELS = [
    'low',
    'normal',
    'high',
    'custom',
] as const satisfies readonly FeeLevel['label'][];

export const stakingFeeLevelLabelSchema = z.enum(STAKING_FEE_LEVEL_LABELS);

export type StakingFeeLevelLabel = z.infer<typeof stakingFeeLevelLabelSchema>;

export const stakingFeeRateSchema = z.string().regex(/^\d+(\.\d+)?$/);

export const stakingFeeLimitSchema = z.string().regex(/^\d+$/);

export const stakingFeeLevelExtrasSchema = z.strictObject({
    bytes: z.number().int().nonnegative().optional(),
    estimatedFeeLimit: stakingFeeLimitSchema.optional(),
    maxFeePerGas: stakingFeeRateSchema.optional(),
    maxPriorityFeePerGas: stakingFeeRateSchema.optional(),
});

export type StakingFeeLevelExtras = z.infer<typeof stakingFeeLevelExtrasSchema>;

export const stakingFinalFeeLevelSchema = z.strictObject({
    type: z.literal('final'),
    fee: stakingAmountSchema,
    totalSpent: stakingAmountSchema,
    feePerUnit: stakingFeeRateSchema.nullable(),
    feeLimit: stakingFeeLimitSchema.nullable(),
    max: stakingAmountSchema.nullable(),
    extras: stakingFeeLevelExtrasSchema,
});

export type StakingFinalFeeLevel = z.infer<typeof stakingFinalFeeLevelSchema>;

export const stakingErrorFeeLevelSchema = z.strictObject({
    type: z.literal('error'),
    error: z.string().min(1),
    errorMessage: z
        .strictObject({
            id: z.string().min(1),
            values: z.record(z.string(), z.string()).optional(),
        })
        .nullable(),
});

export type StakingErrorFeeLevel = z.infer<typeof stakingErrorFeeLevelSchema>;

export const stakingFeeLevelSchema = z.discriminatedUnion('type', [
    stakingFinalFeeLevelSchema,
    stakingErrorFeeLevelSchema,
]);

export type StakingFeeLevel = z.infer<typeof stakingFeeLevelSchema>;

export const stakingFeeLevelsSchema = z
    .partialRecord(stakingFeeLevelLabelSchema, stakingFeeLevelSchema)
    .refine(levels => levels.normal !== undefined, {
        message: 'A normal fee level is required',
        path: ['normal'],
    });

export type StakingFeeLevels = z.infer<typeof stakingFeeLevelsSchema>;

export const stakingCustomFeeSchema = z
    .strictObject({
        feePerUnit: stakingFeeRateSchema,
        feeLimit: stakingFeeLimitSchema.optional(),
        maxFeePerGas: stakingFeeRateSchema.optional(),
        maxPriorityFeePerGas: stakingFeeRateSchema.optional(),
    })
    .refine(fee => (fee.maxFeePerGas === undefined) === (fee.maxPriorityFeePerGas === undefined), {
        message: 'maxFeePerGas and maxPriorityFeePerGas are set together or not at all',
        path: ['maxPriorityFeePerGas'],
    });

export type StakingCustomFee = z.infer<typeof stakingCustomFeeSchema>;
