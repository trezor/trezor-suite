import { z } from 'zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';
import { stakingOperationSchema } from './stakingOperation';
import { stakingPositionDetailsSchema } from './stakingPositionDetails';
import { stakingProductIdSchema } from './stakingProductId';
import { stakingProviderIdSchema } from './stakingProvider';

export const STAKING_POSITION_STATUSES = [
    'activating',
    'active',
    'deactivating',
    'inactive',
] as const;

/**
 * `locked`: the position's amounts are held outside `account.balance`, as in a pool contract or a
 * stake account. `liquid`: they are already part of `account.balance`, as Cardano delegation is,
 * so they must never be added to it.
 */
export const STAKING_POSITION_LOCKUPS = ['locked', 'liquid'] as const;

export const stakingPositionWarningSchema = z.discriminatedUnion('code', [
    z.strictObject({ code: z.literal('outdated-provider'), providerId: stakingProviderIdSchema }),
    z.strictObject({ code: z.literal('missing-drep') }),
]);

export type StakingPositionWarning = z.infer<typeof stakingPositionWarningSchema>;

export type StakingPositionWarningCode = StakingPositionWarning['code'];

export const stakingPositionBalancesSchema = z.strictObject({
    staked: stakingAmountSchema,
    pending: stakingAmountSchema,
    unstaking: stakingAmountSchema,
    withdrawable: stakingAmountSchema,
    rewards: stakingAmountSchema,
});

export type StakingPositionBalances = z.infer<typeof stakingPositionBalancesSchema>;

export const stakingPositionUnlockSchema = z.strictObject({
    amount: stakingAmountSchema,
    availableAt: timestampSchema.nullable(),
});

export type StakingPositionUnlock = z.infer<typeof stakingPositionUnlockSchema>;

export const stakingPositionActivationSchema = z.strictObject({
    amount: stakingAmountSchema,
    availableAt: timestampSchema.nullable(),
});

export type StakingPositionActivation = z.infer<typeof stakingPositionActivationSchema>;

export const stakingPositionTargetSchema = z.strictObject({
    address: z.string().min(1),
    providerId: stakingProviderIdSchema,
    name: z.string().optional(),
    amount: stakingAmountSchema,
});

export type StakingPositionTarget = z.infer<typeof stakingPositionTargetSchema>;

export const stakingPositionPendingTransactionSchema = z.strictObject({
    txid: z.string().min(1),
    operation: stakingOperationSchema,
});

export type StakingPositionPendingTransaction = z.infer<
    typeof stakingPositionPendingTransactionSchema
>;

export const stakingPositionSchema = z.strictObject({
    productId: stakingProductIdSchema,
    status: z.enum(STAKING_POSITION_STATUSES),
    lockup: z.enum(STAKING_POSITION_LOCKUPS),
    balances: stakingPositionBalancesSchema,
    activations: z.array(stakingPositionActivationSchema).readonly(),
    unlocks: z.array(stakingPositionUnlockSchema).readonly(),
    targets: z.array(stakingPositionTargetSchema).readonly(),
    operations: z.array(stakingOperationSchema).readonly(),
    pendingTransactions: z.array(stakingPositionPendingTransactionSchema).readonly(),
    warnings: z.array(stakingPositionWarningSchema).readonly(),
    details: stakingPositionDetailsSchema.nullable(),
    /** When the position changes without new account data, as when an unlock or a claim cooldown ends. */
    revalidateAt: timestampSchema.nullable(),
});

export type StakingPosition = z.infer<typeof stakingPositionSchema>;
