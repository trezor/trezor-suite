import * as z from 'zod';

/**
 * Zod schemas for the Everstake Stake-Sync API (Solana rewards).
 * Base URL: https://stake-sync-api.everstake.one/v1/solana/rewards
 */

/**
 * @summary Single reward entry for a Solana stake account.
 */
export const SolanaStakeAccountRewardItem = z.object({
    epoch: z.number().describe('Epoch number'),
    delegator: z.string().describe('Delegator account address'),
    amount: z.string().describe('Reward amount in lamports'),
    currency: z.string().describe('Currency symbol'),
    time: z.string().describe('ISO 8601 timestamp of the reward'),
});

/**
 * @summary Rewards history response.
 * Endpoint: POST /{address}
 */
export const SolanaStakeAccountRewardsResponse = z.array(SolanaStakeAccountRewardItem);

/**
 * @summary Total rewards response.
 * Endpoint: GET /{address}/total?validator={validator}
 */
export const SolanaTotalStakeRewardsResponse = z.object({
    rewards: z.coerce.string().describe('Total rewards amount'),
});
