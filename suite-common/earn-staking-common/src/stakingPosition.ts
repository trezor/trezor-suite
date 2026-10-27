import { z } from 'zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';
import { stakingOperationSchema } from './stakingOperation';
import { stakingProductIdSchema } from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

export const STAKING_POSITION_STATUSES = [
    'activating',
    'active',
    'deactivating',
    'inactive',
] as const;

export const STAKING_POSITION_LOCKUPS = ['locked', 'liquid'] as const;

export const stakingPositionWarningSchema = z.discriminatedUnion('code', [
    z.object({ code: z.literal('outdated-provider'), providerId: stakingProviderIdSchema }),
    z.object({ code: z.literal('missing-drep') }),
]);

export type StakingPositionWarning = z.infer<typeof stakingPositionWarningSchema>;

export type StakingPositionWarningCode = StakingPositionWarning['code'];

export const stakingPositionBalancesSchema = z.object({
    staked: stakingAmountSchema,
    pending: stakingAmountSchema,
    unstaking: stakingAmountSchema,
    withdrawable: stakingAmountSchema,
    rewards: stakingAmountSchema,
});

export type StakingPositionBalances = z.infer<typeof stakingPositionBalancesSchema>;

export const stakingPositionUnlockSchema = z.object({
    amount: stakingAmountSchema,
    availableAt: timestampSchema.nullable(),
});

export type StakingPositionUnlock = z.infer<typeof stakingPositionUnlockSchema>;

export const stakingPositionTargetSchema = z.object({
    address: z.string().min(1),
    providerId: stakingProviderIdSchema,
    name: z.string().optional(),
    amount: stakingAmountSchema,
});

export type StakingPositionTarget = z.infer<typeof stakingPositionTargetSchema>;

export const stakingPositionSchema = z.object({
    productId: stakingProductIdSchema,
    status: z.enum(STAKING_POSITION_STATUSES),
    lockup: z.enum(STAKING_POSITION_LOCKUPS),
    balances: stakingPositionBalancesSchema,
    unlocks: z.array(stakingPositionUnlockSchema).readonly(),
    targets: z.array(stakingPositionTargetSchema).readonly(),
    operations: z.array(stakingOperationSchema).readonly(),
    pendingTxids: z.array(z.string()).readonly(),
    warnings: z.array(stakingPositionWarningSchema).readonly(),
});

export type StakingPosition = z.infer<typeof stakingPositionSchema>;
