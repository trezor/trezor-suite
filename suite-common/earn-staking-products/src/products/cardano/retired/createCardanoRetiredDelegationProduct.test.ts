import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { mockCardanoStakingAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoRetiredDelegationProduct } from './createCardanoRetiredDelegationProduct';
import { everstakeProvider } from '../../../providers/everstake';
import { fivebinariesProvider } from '../../../providers/fivebinaries';
import { CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO } from '../cardanoDelegationProductInfo';
import { CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES } from '../cardanoMessageSystemFeatures';

const account = mockStakingAccount({ symbol: asNetworkSymbol('ada') });

const createFiveBinariesProduct = () =>
    createCardanoRetiredDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        provider: fivebinariesProvider,
        messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    });

describe('createCardanoRetiredDelegationProduct', () => {
    it('builds the FiveBinaries product', () => {
        expect(createFiveBinariesProduct().descriptor.id).toBe('ada:ada:fivebinaries:native');
    });

    it('refuses a provider that is not retired', () => {
        expect(() =>
            createCardanoRetiredDelegationProduct({
                networkSymbol: asNetworkSymbol('ada'),
                provider: everstakeProvider,
                messageSystemFeatures: {},
            }),
        ).toThrow('everstake has no retired ada pool');
    });

    it('answers its product info without a request', async () => {
        await expect(createFiveBinariesProduct().fetchProductInfo({})).resolves.toBe(
            CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO,
        );
    });

    it('derives the position of a stake key delegated to its pools only', () => {
        const product = createFiveBinariesProduct();

        expect(
            product.getPosition({
                account: mockCardanoStakingAccount('fiveBinaries'),
                productInfo: null,
                transactions: [],
            }),
        ).toMatchObject({
            productId: 'ada:ada:fivebinaries:native',
            warnings: [{ code: 'outdated-provider', providerId: 'fivebinaries' }],
        });
        expect(
            product.getPosition({
                account: mockCardanoStakingAccount('everstake'),
                productInfo: null,
                transactions: [],
            }),
        ).toBeNull();
    });

    it('does not bound a stake', () => {
        expect(() =>
            createFiveBinariesProduct().getAmountBounds({
                account,
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });

    it('has no operations yet', async () => {
        await expect(
            createFiveBinariesProduct().composeStep({
                account,
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));
    });
});
