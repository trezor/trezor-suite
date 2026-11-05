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
    rentExemptReserve: stakingAmountSchema,
    activationEpoch: z.number().int().nonnegative().nullable(),
});

export type SolanaStakeAccount = z.infer<typeof solanaStakeAccountSchema>;

// Bech32 is case-insensitive; the contract keeps the lowercase form the provider identities use.
export const cardanoPoolIdSchema = z.string().regex(/^pool1[02-9ac-hj-np-z]+$/);

/**
 * The DRep as the backend reports it: `id` may be a legacy CIP-105 or a CIP-129 bech32 id, or one
 * of the predefined `drep_always_*` options. Compare it only after normalizing with `hasScript`.
 * Like the pool id, it is display data and never a certificate input; a write kit takes the DRep
 * from the user's choice or omits the certificate.
 */
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
        poolId: cardanoPoolIdSchema.nullable(),
        drep: cardanoDrepSchema.nullable(),
    }),
    z.strictObject({
        kind: z.literal('tron-staking'),
        frozen: tronResourceAmountsSchema,
        delegated: tronResourceAmountsSchema,
        votingPower: stakingAmountSchema,
        unallocatedVotingPower: stakingAmountSchema,
        rewardClaimAvailableAt: timestampSchema.nullable(),
    }),
]);

export type StakingPositionDetails = z.infer<typeof stakingPositionDetailsSchema>;
