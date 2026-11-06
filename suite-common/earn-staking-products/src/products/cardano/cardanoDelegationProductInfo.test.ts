import type { AdaPools } from '@suite-common/earn-staking-api';
import { stakingProductInfoSchema } from '@suite-common/earn-staking-common';
import {
    MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
    MOCK_CARDANO_EVERSTAKE_POOL,
    MOCK_CARDANO_EXTERNAL_POOL,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO,
    type CardanoDelegationProductInfoDeps,
    fetchCardanoDelegationProductInfo,
} from './cardanoDelegationProductInfo';
import { everstakeProvider } from '../../providers/everstake';

const everstakePools = everstakeProvider.identities[asNetworkSymbol('ada')] ?? [];

const adaPools: AdaPools = {
    pools: [
        { apy: 2.4, saturation: 80.77, id: MOCK_CARDANO_EVERSTAKE_OTHER_POOL },
        { apy: 2.06, saturation: 62.64, id: MOCK_CARDANO_EVERSTAKE_POOL },
    ],
};

const createDeps = (pools: AdaPools = adaPools) =>
    createMockDeps<CardanoDelegationProductInfoDeps>({
        getCardanoPools: () => Promise.resolve(pools),
    });

const fetchEverstakeInfo = (deps: CardanoDelegationProductInfoDeps, abortSignal?: AbortSignal) =>
    fetchCardanoDelegationProductInfo(deps, {
        abortSignal,
        provider: everstakeProvider,
        poolIds: everstakePools,
    });

describe('fetchCardanoDelegationProductInfo', () => {
    it('lists the provider pools and promotes the least saturated one', async () => {
        await expect(fetchEverstakeInfo(createDeps())).resolves.toEqual({
            rate: 2.06,
            entryPeriodDays: null,
            exitPeriodDays: 5,
            nextRewardAt: null,
            targets: [
                {
                    address: MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
                    providerId: 'everstake',
                    name: 'Everstake',
                    rate: 2.4,
                    saturation: 80.77,
                },
                {
                    address: MOCK_CARDANO_EVERSTAKE_POOL,
                    providerId: 'everstake',
                    name: 'Everstake',
                    rate: 2.06,
                    saturation: 62.64,
                },
            ],
        });
    });

    it('leaves out a pool the provider does not own', async () => {
        const info = await fetchEverstakeInfo(
            createDeps({
                pools: [
                    ...adaPools.pools,
                    { apy: 9.9, saturation: 1, id: MOCK_CARDANO_EXTERNAL_POOL },
                ],
            }),
        );

        expect(info.rate).toBe(2.06);
        expect(info.targets.map(({ address }) => address)).toEqual([
            MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
            MOCK_CARDANO_EVERSTAKE_POOL,
        ]);
    });

    it('matches an upper-case pool id and lists it in lower case', async () => {
        const info = await fetchEverstakeInfo(
            createDeps({
                pools: adaPools.pools.map(pool => ({ ...pool, id: pool.id.toUpperCase() })),
            }),
        );

        expect(info.targets.map(({ address }) => address)).toEqual([
            MOCK_CARDANO_EVERSTAKE_OTHER_POOL,
            MOCK_CARDANO_EVERSTAKE_POOL,
        ]);
    });

    it('keeps the first entry of a pool the response repeats', async () => {
        const info = await fetchEverstakeInfo(
            createDeps({
                pools: [
                    ...adaPools.pools,
                    { apy: 9.9, saturation: 1, id: MOCK_CARDANO_EVERSTAKE_POOL.toUpperCase() },
                ],
            }),
        );

        expect(info.rate).toBe(2.06);
        expect(info.targets.map(({ address, rate }) => ({ address, rate }))).toEqual([
            { address: MOCK_CARDANO_EVERSTAKE_OTHER_POOL, rate: 2.4 },
            { address: MOCK_CARDANO_EVERSTAKE_POOL, rate: 2.06 },
        ]);
    });

    it('promotes the first of two equally saturated pools', async () => {
        const info = await fetchEverstakeInfo(
            createDeps({
                pools: [
                    { apy: 2.4, saturation: 50, id: MOCK_CARDANO_EVERSTAKE_OTHER_POOL },
                    { apy: 2.06, saturation: 50, id: MOCK_CARDANO_EVERSTAKE_POOL },
                ],
            }),
        );

        expect(info.rate).toBe(2.4);
    });

    it('has no rate without pools', async () => {
        await expect(fetchEverstakeInfo(createDeps({ pools: [] }))).resolves.toMatchObject({
            rate: null,
            targets: [],
        });
    });

    it('requests every pool with the abort signal', async () => {
        const deps = createDeps();
        const abortSignal = new AbortController().signal;

        await fetchEverstakeInfo(deps, abortSignal);

        expect(deps.getCardanoPools).toHaveBeenCalledWith({
            signal: abortSignal,
            params: { limit: 1000 },
        });
    });

    it('rejects when the pools request fails', async () => {
        const deps = createMockDeps<CardanoDelegationProductInfoDeps>({
            getCardanoPools: () => Promise.reject(new Error('Request failed')),
        });

        await expect(fetchEverstakeInfo(deps)).rejects.toThrow('Request failed');
    });
});

describe('CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO', () => {
    it('knows only the exit period', () => {
        expect(stakingProductInfoSchema.parse(CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO)).toEqual({
            rate: null,
            entryPeriodDays: null,
            exitPeriodDays: 5,
            nextRewardAt: null,
            targets: [],
        });
    });
});
