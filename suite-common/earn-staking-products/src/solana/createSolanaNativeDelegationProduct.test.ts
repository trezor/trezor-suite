import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import { StakingAdapterError } from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type SolanaNativeDelegationProductDeps,
    createSolanaNativeDelegationProduct,
} from './createSolanaNativeDelegationProduct';
import { everstakeProvider } from '../providers/everstake';
import { externalProvider } from '../providers/external';
import { luganodesProvider } from '../providers/luganodes';
import { STAKING_OPERATION_NOT_IMPLEMENTED } from '../shared/unimplementedStakingOperations';

const stats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

const createDeps = () =>
    createMockDeps<SolanaNativeDelegationProductDeps>({
        getStakingStats: () => Promise.resolve(stats),
    });

const createEverstakeProduct = (symbol = 'sol', deps = createDeps()) =>
    createSolanaNativeDelegationProduct({
        networkSymbol: asNetworkSymbol(symbol),
        provider: everstakeProvider,
        messageSystemFeatures: {},
        ...deps,
    });

describe('createSolanaNativeDelegationProduct', () => {
    it.each(['sol', 'dsol'])('builds the Everstake product for %s', symbol => {
        expect(createEverstakeProduct(symbol).descriptor.id).toBe(
            `${symbol}:${symbol}:everstake:native`,
        );
    });

    it.each([
        { name: 'a provider without a Solana vote account', provider: luganodesProvider },
        { name: 'a provider that is not active', provider: externalProvider },
    ])('refuses $name', ({ provider }) => {
        expect(() =>
            createSolanaNativeDelegationProduct({
                networkSymbol: asNetworkSymbol('sol'),
                provider,
                messageSystemFeatures: {},
                ...createDeps(),
            }),
        ).toThrow(`${provider.id} has no sol vote account`);
    });

    it('fetches the product info through the injected client', async () => {
        const deps = createDeps();

        await expect(
            createEverstakeProduct('sol', deps).fetchProductInfo({}),
        ).resolves.toMatchObject({ rate: 6.24, entryPeriodDays: 1, exitPeriodDays: 1 });
        expect(deps.getStakingStats).toHaveBeenCalledTimes(1);
    });

    it('bounds a stake by the product limits', () => {
        expect(
            createEverstakeProduct().getAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('sol'),
                    balance: '1000000000',
                }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '1000000000', max: '995000000' });
    });

    it('has no operations yet', async () => {
        await expect(
            createEverstakeProduct().composeStep({
                account: mockStakingAccount({ symbol: asNetworkSymbol('sol') }),
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_NOT_IMPLEMENTED));
    });
});
