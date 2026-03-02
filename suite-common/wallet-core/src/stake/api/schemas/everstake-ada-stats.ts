import * as z from 'zod';

/**
 * Zod schemas for the Everstake Stats API (Cardano validator stats).
 * Base URL: https://stats.everstake.one
 * Endpoint: GET /blockchain/summary?limit=1000&offset=0&partner=Trezor
 */

export const CardanoValidatorStatsItem = z.object({
    apr: z.object({ value: z.string() }),
    apy: z.object({ value: z.string() }),
    blockchain_name: z.string(),
    date: z.string(),
    delegators_number: z.number(),
    fee: z.string(),
    precision: z.number(),
    price: z.number(),
    saturation: z.number().describe('Saturation as a decimal (0-1)'),
    stake: z.string(),
    token: z.string(),
    total_stake_usd: z.number(),
    validator_address: z.string(),
    validator_name: z.string(),
});

/**
 * @summary Cardano validator stats from Everstake Stats API.
 */
export const CardanoStatsResponse = z.object({
    data: z.array(CardanoValidatorStatsItem),
});
