import type { EthOrSolStats, EthValidatorsQueue } from '@suite-common/earn-staking-api';
import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { mockEthereumStakingAccount } from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type EverstakePooledProductDeps,
    createEverstakePooledProduct,
} from './createEverstakePooledProduct';

const stats: EthOrSolStats = { symbol: 'eth', apy: 3.08, nextRewardPayout: 432_000 };
const queue: EthValidatorsQueue = { addingDelay: 86_400, activationTime: 259_200 };

const createDeps = () =>
    createMockDeps<EverstakePooledProductDeps>({
        getStakingStats: () => Promise.resolve(stats),
        getEthereumValidatorsQueue: () => Promise.resolve(queue),
    });

describe('createEverstakePooledProduct', () => {
    it.each(['eth', 'thod'])('describes the %s product', symbol => {
        const product = createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol(symbol),
            ...createDeps(),
        });

        expect(product.descriptor.id).toBe(`${symbol}:${symbol}:everstake:pooled`);
    });

    it('refuses a network without an Everstake pool contract', () => {
        expect(() =>
            createEverstakePooledProduct({
                networkSymbol: asNetworkSymbol('sol'),
                ...createDeps(),
            }),
        ).toThrow('Everstake has no pool contract on sol');
    });

    it('fetches the product info through the injected client', async () => {
        const deps = createDeps();
        const product = createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...deps,
        });

        await expect(product.fetchProductInfo({})).resolves.toMatchObject({
            rate: 3.08,
            entryPeriodDays: 4,
        });
        expect(deps.getStakingStats).toHaveBeenCalledTimes(1);
        expect(deps.getEthereumValidatorsQueue).toHaveBeenCalledTimes(1);
    });

    it('derives the position of an account with an Everstake pool', () => {
        const product = createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...createDeps(),
        });

        expect(
            product.getPosition({
                account: mockEthereumStakingAccount('active'),
                productInfo: null,
                transactions: [],
            }),
        ).toMatchObject({
            productId: 'eth:eth:everstake:pooled',
            status: 'active',
            targets: [{ address: '0xD523794C879D9eC028960a231F866758e405bE34' }],
        });
        expect(
            product.getPosition({
                account: mockStakingAccount(),
                productInfo: null,
                transactions: [],
            }),
        ).toBeNull();
    });

    it('bounds a stake by the product limits', () => {
        const product = createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...createDeps(),
        });

        expect(
            product.getAmountBounds({
                account: mockStakingAccount({ balance: '1000000000000000000' }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '10000000000000000', max: '995000000000000000' });
    });

    it('has no operations yet', async () => {
        const product = createEverstakePooledProduct({
            networkSymbol: asNetworkSymbol('eth'),
            ...createDeps(),
        });

        await expect(
            product.composeStep({
                account: mockStakingAccount(),
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));
    });
});
