import type { EthOrSolStats, EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type EverstakePooledProductInfoDeps,
    fetchEverstakePooledProductInfo,
} from './everstakePooledProductInfo';

const SECONDS_IN_DAY = 24 * 60 * 60;
const NOW = 1_800_000_000_000;

const ethStats: EthOrSolStats = { symbol: 'eth', apy: 3.08, nextRewardPayout: 5 * SECONDS_IN_DAY };

const validatorsQueue: EthValidatorsQueue = {
    activationTime: 3 * SECONDS_IN_DAY,
    exitTime: 2 * SECONDS_IN_DAY,
    withdrawTime: SECONDS_IN_DAY,
    addingDelay: SECONDS_IN_DAY,
    updatedAt: NOW / 1000,
};

const createDeps = (stats: EthOrSolStats = ethStats, queue: EthValidatorsQueue = validatorsQueue) =>
    createMockDeps<EverstakePooledProductInfoDeps>({
        getStakingStats: () => Promise.resolve(stats),
        getEthereumValidatorsQueue: () => Promise.resolve(queue),
    });

describe('fetchEverstakePooledProductInfo', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(NOW);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('maps the stats and the validators queue onto the product info', async () => {
        await expect(fetchEverstakePooledProductInfo(createDeps(), {})).resolves.toEqual({
            rate: 3.08,
            entryPeriodDays: 4,
            exitPeriodDays: 3,
            nextRewardAt: NOW + 5 * SECONDS_IN_DAY * 1000,
            targets: [],
        });
    });

    it('requests mainnet stats and passes the abort signal to both requests', async () => {
        const deps = createDeps();
        const abortSignal = new AbortController().signal;

        await fetchEverstakePooledProductInfo(deps, { abortSignal });

        expect(deps.getStakingStats).toHaveBeenCalledWith({
            routeParams: { networkSymbol: 'eth' },
            signal: abortSignal,
        });
        expect(deps.getEthereumValidatorsQueue).toHaveBeenCalledWith({ signal: abortSignal });
    });

    it('leaves a period unknown when the queue lacks one of its parts', async () => {
        const deps = createDeps(ethStats, { activationTime: 3 * SECONDS_IN_DAY, exitTime: 0 });

        await expect(fetchEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            entryPeriodDays: null,
            exitPeriodDays: null,
        });
    });

    it('reports at least one day for a period shorter than half a day', async () => {
        const deps = createDeps(ethStats, {
            activationTime: 60,
            addingDelay: 60,
            withdrawTime: 60,
            exitTime: 60,
        });

        await expect(fetchEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            entryPeriodDays: 1,
            exitPeriodDays: 1,
        });
    });

    it('has no next reward time when the stats are not the mainnet pool stats', async () => {
        const deps = createDeps({ symbol: 'sol', apy: 6.24 });

        await expect(fetchEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            rate: 6.24,
            nextRewardAt: null,
        });
    });

    it('rejects when either request rejects', async () => {
        const deps = createMockDeps<EverstakePooledProductInfoDeps>({
            getStakingStats: () => Promise.resolve(ethStats),
            getEthereumValidatorsQueue: () => Promise.reject(new Error('queue unavailable')),
        });

        await expect(fetchEverstakePooledProductInfo(deps, {})).rejects.toThrow(
            'queue unavailable',
        );
    });
});
