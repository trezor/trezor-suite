import { z } from 'zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingProviderIdSchema } from './stakingProvider';

export const stakingProductTargetSchema = z.object({
    address: z.string().min(1),
    providerId: stakingProviderIdSchema,
    name: z.string().optional(),
    rate: z.number().nullable(),
});

export type StakingProductTarget = z.infer<typeof stakingProductTargetSchema>;

export const stakingProductInfoSchema = z.object({
    rate: z.number().nullable(),
    entryPeriodDays: z.number().nullable(),
    exitPeriodDays: z.number().nullable(),
    nextRewardAt: timestampSchema.nullable(),
    targets: z.array(stakingProductTargetSchema).readonly(),
});

export type StakingProductInfo = z.infer<typeof stakingProductInfoSchema>;
