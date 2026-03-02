import * as z from 'zod';

/**
 * Zod schemas for the Everstake Dashboard API (Solana staking info).
 * Base URL: https://dashboard-api.everstake.one
 * Endpoint: GET /chain?name=solana
 */

export const SolanaBlockchainInfo = z.object({
    apr: z.number().describe('Annual percentage rate in decimal form'),
});

/**
 * @summary Solana staking info from Everstake Dashboard API.
 */
export const SolanaDashboardResponse = z.object({
    blockchain: SolanaBlockchainInfo,
});
