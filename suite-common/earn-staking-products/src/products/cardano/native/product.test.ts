import type { AdaPools } from '@suite-common/earn-staking-api';
import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_CARDANO_EVERSTAKE_POOL,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type CardanoNativeDelegationProductDeps,
    createCardanoNativeDelegationProduct,
} from './product';
import { everstakeProvider } from '../../../providers/everstake';
import { fivebinariesProvider } from '../../../providers/fivebinaries';
import { luganodesProvider } from '../../../providers/luganodes';
import { EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES } from '../messageSystemFeatures';

const adaPools: AdaPools = {
    pools: [{ apy: 2.06, saturation: 62.64, id: MOCK_CARDANO_EVERSTAKE_POOL }],
};

const createDeps = () =>
    createMockDeps<CardanoNativeDelegationProductDeps>({
        getCardanoPools: () => Promise.resolve(adaPools),
    });

const createEverstakeProduct = (deps = createDeps()) =>
    createCardanoNativeDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        provider: everstakeProvider,
        messageSystemFeatures: EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
        ...deps,
    });

describe('createCardanoNativeDelegationProduct', () => {
    it('builds the Everstake product', () => {
        expect(createEverstakeProduct().descriptor.id).toBe('ada:ada:everstake:native');
    });

    it.each([
        { name: 'a provider without a Cardano pool', provider: luganodesProvider },
        { name: 'a provider that is not active', provider: fivebinariesProvider },
    ])('refuses $name', ({ provider }) => {
        expect(() =>
            createCardanoNativeDelegationProduct({
                networkSymbol: asNetworkSymbol('ada'),
                provider,
                messageSystemFeatures: {},
                ...createDeps(),
            }),
        ).toThrow(`${provider.id} has no ada pool`);
    });

    it('fetches the product info through the injected client', async () => {
        const deps = createDeps();

        await expect(createEverstakeProduct(deps).fetchProductInfo({})).resolves.toMatchObject({
            rate: 2.06,
            exitPeriodDays: 5,
            targets: [{ address: MOCK_CARDANO_EVERSTAKE_POOL, providerId: 'everstake' }],
        });
        expect(deps.getCardanoPools).toHaveBeenCalledTimes(1);
    });

    it('derives the position of a stake key delegated to its pools only', () => {
        const product = createEverstakeProduct();

        expect(
            product.getPosition({
                account: mockCardanoStakingAccount('everstake'),
                productInfo: null,
                transactions: [],
            }),
        ).toMatchObject({ productId: 'ada:ada:everstake:native', status: 'active' });
        expect(
            product.getPosition({
                account: mockCardanoStakingAccount('fiveBinaries'),
                productInfo: null,
                transactions: [],
            }),
        ).toBeNull();
    });

    it('bounds a stake by the product limits', () => {
        expect(
            createEverstakeProduct().getAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('ada'),
                    balance: '1000000000',
                }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '0', max: '1000000000' });
    });

    it('has no operations yet', async () => {
        await expect(
            createEverstakeProduct().composeStep({
                account: mockStakingAccount({ symbol: asNetworkSymbol('ada') }),
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));
    });
});
