import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import { stakingProductInfoSchema } from '@suite-common/earn-staking-common';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    SOLANA_EXTERNAL_PRODUCT_INFO,
    type SolanaProductInfoDeps,
    fetchSolanaProductInfo,
} from './info';

const solStats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

const createDeps = (stats: EthOrSolStats = solStats) =>
    createMockDeps<SolanaProductInfoDeps>({
        getStakingStats: () => Promise.resolve(stats),
    });

describe('fetchSolanaProductInfo', () => {
    it('maps the chain APY and one-epoch periods onto the product info', async () => {
        await expect(fetchSolanaProductInfo(createDeps(), {})).resolves.toEqual({
            rate: 6.24,
            entryPeriodDays: 1,
            exitPeriodDays: 1,
            nextRewardAt: null,
            targets: [],
        });
    });

    it('requests the mainnet stats with the abort signal', async () => {
        const deps = createDeps();
        const abortSignal = new AbortController().signal;

        await fetchSolanaProductInfo(deps, { abortSignal });

        expect(deps.getStakingStats).toHaveBeenCalledWith({
            routeParams: { networkSymbol: 'sol' },
            signal: abortSignal,
        });
    });

    it('rejects when the stats request fails', async () => {
        const deps = createMockDeps<SolanaProductInfoDeps>({
            getStakingStats: () => Promise.reject(new Error('Request failed')),
        });

        await expect(fetchSolanaProductInfo(deps, {})).rejects.toThrow('Request failed');
    });

    it('rejects a negative APY instead of caching it', async () => {
        await expect(
            fetchSolanaProductInfo(createDeps({ symbol: 'sol', apy: -0.5 }), {}),
        ).rejects.toThrow();
    });
});

describe('SOLANA_EXTERNAL_PRODUCT_INFO', () => {
    it('knows no rate, periods or targets', () => {
        expect(stakingProductInfoSchema.parse(SOLANA_EXTERNAL_PRODUCT_INFO)).toEqual({
            rate: null,
            entryPeriodDays: null,
            exitPeriodDays: null,
            nextRewardAt: null,
            targets: [],
        });
    });
});
