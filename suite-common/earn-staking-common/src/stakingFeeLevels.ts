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

export const stakingFeeLevelExtraValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export type StakingFeeLevelExtraValue = z.infer<typeof stakingFeeLevelExtraValueSchema>;

export const stakingFinalFeeLevelSchema = z.strictObject({
    type: z.literal('final'),
    fee: stakingAmountSchema,
    totalSpent: stakingAmountSchema,
    feePerUnit: z.string(),
    feeLimit: z.string().nullable(),
    max: stakingAmountSchema.nullable(),
    extras: z.record(z.string(), stakingFeeLevelExtraValueSchema),
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

export const stakingFeeLevelsSchema = z.partialRecord(
    stakingFeeLevelLabelSchema,
    stakingFeeLevelSchema,
);

export type StakingFeeLevels = z.infer<typeof stakingFeeLevelsSchema>;

export const stakingCustomFeeSchema = z.strictObject({
    feePerUnit: z.string().min(1),
    feeLimit: z.string().optional(),
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
});

export type StakingCustomFee = z.infer<typeof stakingCustomFeeSchema>;
