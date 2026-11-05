import { z } from 'zod';

import { timestampSchema } from './primitiveSchemas';
import { stakingAmountSchema } from './stakingAmount';

export const SOLANA_STAKE_ACCOUNT_STATUSES = [
    'inactive',
    'activating',
    'active',
    'deactivating',
    'deactivated',
] as const;

export const solanaStakeAccountStatusSchema = z.enum(SOLANA_STAKE_ACCOUNT_STATUSES);

export type SolanaStakeAccountStatus = z.infer<typeof solanaStakeAccountStatusSchema>;

export const solanaStakeAccountSchema = z.strictObject({
    status: solanaStakeAccountStatusSchema,
    stake: stakingAmountSchema,
    activationEpoch: z.number().int().nonnegative().nullable(),
});

export type SolanaStakeAccount = z.infer<typeof solanaStakeAccountSchema>;

export const cardanoDrepSchema = z.strictObject({
    id: z.string().min(1),
    hasScript: z.boolean(),
});

export type CardanoDrep = z.infer<typeof cardanoDrepSchema>;

export const tronResourceAmountsSchema = z.strictObject({
    energy: stakingAmountSchema,
    bandwidth: stakingAmountSchema,
});

export type TronResourceAmounts = z.infer<typeof tronResourceAmountsSchema>;

export const stakingPositionDetailsSchema = z.discriminatedUnion('kind', [
    z.strictObject({
        kind: z.literal('solana-stake-accounts'),
        epoch: z.number().int().nonnegative().nullable(),
        stakeAccounts: z.array(solanaStakeAccountSchema).readonly(),
    }),
    z.strictObject({
        kind: z.literal('cardano-delegation'),
        poolId: z.string().min(1).nullable(),
        drep: cardanoDrepSchema.nullable(),
    }),
    z.strictObject({
        kind: z.literal('tron-staking'),
        frozen: tronResourceAmountsSchema,
        delegated: tronResourceAmountsSchema,
        unallocatedVotingPower: stakingAmountSchema,
        rewardClaimAvailableAt: timestampSchema.nullable(),
    }),
]);

export type StakingPositionDetails = z.infer<typeof stakingPositionDetailsSchema>;
