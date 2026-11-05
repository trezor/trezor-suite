import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import { stakingProductInfoSchema } from '@suite-common/earn-staking-common';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    SOLANA_EXTERNAL_PRODUCT_INFO,
    type SolanaDelegationProductInfoDeps,
    fetchSolanaDelegationProductInfo,
} from './solanaDelegationProductInfo';

const solStats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

const createDeps = (stats: EthOrSolStats = solStats) =>
    createMockDeps<SolanaDelegationProductInfoDeps>({
        getStakingStats: () => Promise.resolve(stats),
    });

describe('fetchSolanaDelegationProductInfo', () => {
    it('maps the chain APY and one-epoch periods onto the product info', async () => {
        await expect(fetchSolanaDelegationProductInfo(createDeps(), {})).resolves.toEqual({
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

        await fetchSolanaDelegationProductInfo(deps, { abortSignal });

        expect(deps.getStakingStats).toHaveBeenCalledWith({
            routeParams: { networkSymbol: 'sol' },
            signal: abortSignal,
        });
    });

    it('rejects when the stats request fails', async () => {
        const deps = createMockDeps<SolanaDelegationProductInfoDeps>({
            getStakingStats: () => Promise.reject(new Error('Request failed')),
        });

        await expect(fetchSolanaDelegationProductInfo(deps, {})).rejects.toThrow('Request failed');
    });

    it('rejects a negative APY instead of caching it', async () => {
        await expect(
            fetchSolanaDelegationProductInfo(createDeps({ symbol: 'sol', apy: -0.5 }), {}),
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
