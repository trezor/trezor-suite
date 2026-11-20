import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import { stakingProductInfoSchema } from '@suite-common/earn-staking-common';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    SOLANA_EXTERNAL_PRODUCT_INFO,
    type SolanaProductInfoDeps,
    fetchSolanaProductInfo,
} from './productInfo';

const solStats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

const sol = asNetworkSymbol('sol');
const dsol = asNetworkSymbol('dsol');

const createDeps = (stats: EthOrSolStats = solStats) =>
    createMockDeps<SolanaProductInfoDeps>({
        getStakingStats: () => Promise.resolve(stats),
    });

describe('fetchSolanaProductInfo', () => {
    it('maps the chain APY and one-epoch periods onto the product info', async () => {
        await expect(fetchSolanaProductInfo(createDeps(), { networkSymbol: sol })).resolves.toEqual(
            {
                rate: 6.24,
                entryPeriodDays: 1,
                exitPeriodDays: 1,
                rewardPeriodDays: 1,
                nextRewardAt: null,
                targets: [],
            },
        );
    });

    it('requests the mainnet stats with the abort signal', async () => {
        const deps = createDeps();
        const abortSignal = new AbortController().signal;

        await fetchSolanaProductInfo(deps, { networkSymbol: sol, abortSignal });

        expect(deps.getStakingStats).toHaveBeenCalledWith({
            routeParams: { networkSymbol: 'sol' },
            signal: abortSignal,
        });
    });

    it('rejects when the stats request fails', async () => {
        const deps = createMockDeps<SolanaProductInfoDeps>({
            getStakingStats: () => Promise.reject(new Error('Request failed')),
        });

        await expect(fetchSolanaProductInfo(deps, { networkSymbol: sol })).rejects.toThrow(
            'Request failed',
        );
    });

    it('takes no rate for a product on another network than the stats name', async () => {
        await expect(
            fetchSolanaProductInfo(createDeps(), { networkSymbol: dsol }),
        ).resolves.toMatchObject({ rate: null, entryPeriodDays: 1, exitPeriodDays: 1 });
    });

    it('rejects stats of another network instead of taking their rate', async () => {
        await expect(
            fetchSolanaProductInfo(createDeps({ symbol: 'eth', apy: 3.08, nextRewardPayout: 0 }), {
                networkSymbol: sol,
            }),
        ).rejects.toThrow('Expected sol staking stats, received eth');
    });

    it('rejects a negative APY instead of caching it', async () => {
        await expect(
            fetchSolanaProductInfo(createDeps({ symbol: 'sol', apy: -0.5 }), {
                networkSymbol: sol,
            }),
        ).rejects.toThrow();
    });
});

describe('SOLANA_EXTERNAL_PRODUCT_INFO', () => {
    it('knows no rate, periods or targets', () => {
        expect(stakingProductInfoSchema.parse(SOLANA_EXTERNAL_PRODUCT_INFO)).toEqual({
            rate: null,
            entryPeriodDays: null,
            exitPeriodDays: null,
            rewardPeriodDays: null,
            nextRewardAt: null,
            targets: [],
        });
    });
});
