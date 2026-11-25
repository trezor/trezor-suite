import { z } from '@trezor/zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';
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
    rewardPeriodDays: z.number().nullable(),
    nextRewardAt: timestampSchema.nullable(),
    /**
     * What one whole liquid staking token is worth in the staked asset, in its smallest unit, for
     * a product whose token keeps its balance and gains value instead, as wstETH does.
     */
    liquidTokenValue: stakingAmountSchema.nullable().optional(),
    targets: z
        .array(stakingProductTargetSchema)
        .refine(targets => new Set(targets.map(({ address }) => address)).size === targets.length, {
            error: 'Expected every target to have its own address',
        })
        .readonly(),
});

export type StakingProductInfo = z.infer<typeof stakingProductInfoSchema>;
