import type { EthOrSolStats, EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type EthereumEverstakePooledProductInfoDeps,
    fetchEthereumEverstakePooledProductInfo,
} from './info';

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
    createMockDeps<EthereumEverstakePooledProductInfoDeps>({
        getStakingStats: () => Promise.resolve(stats),
        getEthereumValidatorsQueue: () => Promise.resolve(queue),
    });

describe('fetchEthereumEverstakePooledProductInfo', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(NOW);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('maps the stats and the validators queue onto the product info', async () => {
        await expect(fetchEthereumEverstakePooledProductInfo(createDeps(), {})).resolves.toEqual({
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

        await fetchEthereumEverstakePooledProductInfo(deps, { abortSignal });

        expect(deps.getStakingStats).toHaveBeenCalledWith({
            routeParams: { networkSymbol: 'eth' },
            signal: abortSignal,
        });
        expect(deps.getEthereumValidatorsQueue).toHaveBeenCalledWith({ signal: abortSignal });
    });

    it('leaves a period unknown when the queue lacks one of its parts', async () => {
        const deps = createDeps(ethStats, { activationTime: 3 * SECONDS_IN_DAY, exitTime: 0 });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            entryPeriodDays: null,
            exitPeriodDays: null,
        });
    });

    it.each([
        { name: 'shorter than half a day', seconds: 60 },
        { name: 'of zero seconds', seconds: 0 },
    ])(
        'reports at least one entry day but zero exit days for a queue $name',
        async ({ seconds }) => {
            const deps = createDeps(ethStats, {
                activationTime: seconds,
                addingDelay: seconds,
                withdrawTime: seconds,
                exitTime: seconds,
            });

            await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
                entryPeriodDays: 1,
                exitPeriodDays: 0,
            });
        },
    );

    it('rounds the next reward time to the hour so that a refetch yields equal info', async () => {
        const deps = createDeps();
        const first = await fetchEthereumEverstakePooledProductInfo(deps, {});

        jest.setSystemTime(NOW + 10 * 60 * 1000);
        const second = await fetchEthereumEverstakePooledProductInfo(deps, {});
        jest.setSystemTime(NOW);

        expect(second).toEqual(first);
        expect(first.nextRewardAt).toBe(NOW + 5 * SECONDS_IN_DAY * 1000);
    });

    it('rounds a next reward time between hours to the nearest hour', async () => {
        const deps = createDeps({ ...ethStats, nextRewardPayout: 5 * SECONDS_IN_DAY + 40 * 60 });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            nextRewardAt: NOW + (5 * SECONDS_IN_DAY + 60 * 60) * 1000,
        });
    });

    it('has no next reward time when the stats report no payout', async () => {
        const deps = createDeps({ ...ethStats, nextRewardPayout: 0 });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).resolves.toMatchObject({
            rate: 3.08,
            nextRewardAt: null,
        });
    });

    it('rejects stats of another network instead of taking their rate', async () => {
        const deps = createDeps({ symbol: 'sol', apy: 6.24 });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).rejects.toThrow(
            'Expected eth staking stats, received sol',
        );
    });

    it('keeps the rate and leaves the periods unknown when the queue request rejects', async () => {
        const deps = createMockDeps<EthereumEverstakePooledProductInfoDeps>({
            getStakingStats: () => Promise.resolve(ethStats),
            getEthereumValidatorsQueue: () => Promise.reject(new Error('queue unavailable')),
        });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).resolves.toEqual({
            rate: 3.08,
            entryPeriodDays: null,
            exitPeriodDays: null,
            nextRewardAt: NOW + 5 * SECONDS_IN_DAY * 1000,
            targets: [],
        });
    });

    it('rejects when the stats request rejects', async () => {
        const deps = createMockDeps<EthereumEverstakePooledProductInfoDeps>({
            getStakingStats: () => Promise.reject(new Error('stats unavailable')),
            getEthereumValidatorsQueue: () => Promise.resolve(validatorsQueue),
        });

        await expect(fetchEthereumEverstakePooledProductInfo(deps, {})).rejects.toThrow(
            'stats unavailable',
        );
    });
});
