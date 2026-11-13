import { z } from '@trezor/zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingProviderIdSchema } from './stakingProvider';

export const stakingProductTargetSchema = z.strictObject({
    address: z.string().min(1),
    providerId: stakingProviderIdSchema,
    name: z.string().optional(),
    rate: z.number().nonnegative().nullable(),
    saturation: z.number().nonnegative().nullable(),
});

export type StakingProductTarget = z.infer<typeof stakingProductTargetSchema>;

export const stakingProductInfoSchema = z.strictObject({
    rate: z.number().nonnegative().nullable(),
    entryPeriodDays: z.number().nullable(),
    exitPeriodDays: z.number().nullable(),
    nextRewardAt: timestampSchema.nullable(),
    targets: z
        .array(stakingProductTargetSchema)
        .refine(targets => new Set(targets.map(({ address }) => address)).size === targets.length, {
            error: 'Expected every target to have its own address',
        })
        .readonly(),
});

export type StakingProductInfo = z.infer<typeof stakingProductInfoSchema>;
