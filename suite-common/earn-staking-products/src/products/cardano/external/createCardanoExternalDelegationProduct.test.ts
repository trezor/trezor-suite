import { StakingAdapterError, type StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import {
    type CardanoStakingScenario,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoExternalDelegationProduct } from './createCardanoExternalDelegationProduct';
import { everstakeProvider } from '../../../providers/everstake';
import { fivebinariesProvider } from '../../../providers/fivebinaries';
import {
    STAKING_OPERATION_NOT_IMPLEMENTED,
    STAKING_OPERATION_NOT_SUPPORTED,
} from '../../unimplementedStakingOperations';
import { CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO } from '../cardanoDelegationProductInfo';
import { CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES } from '../cardanoMessageSystemFeatures';

const account = mockStakingAccount({ symbol: asNetworkSymbol('ada') });

const createExternalProduct = (managedProviders = [everstakeProvider, fivebinariesProvider]) =>
    createCardanoExternalDelegationProduct({
        networkSymbol: asNetworkSymbol('ada'),
        managedProviders,
        messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
    });

const getStakedBalance = (product: StakingProductAdapter, scenario: CardanoStakingScenario) =>
    product.getPosition({
        account: mockCardanoStakingAccount(scenario),
        productInfo: null,
        transactions: [],
    })?.balances.staked ?? null;

describe('createCardanoExternalDelegationProduct', () => {
    it('builds the external product', () => {
        expect(createExternalProduct().descriptor.id).toBe('ada:ada:external:native');
    });

    it('answers its product info without a request', async () => {
        await expect(createExternalProduct().fetchProductInfo({})).resolves.toBe(
            CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO,
        );
    });

    it('derives the position of a stake key delegated to a pool no managed provider owns', () => {
        expect(getStakedBalance(createExternalProduct(), 'externalPool')).toBe('1000000000');
    });

    it.each(['everstake', 'fiveBinaries'] as const)(
        'leaves the %s stake key to its managed provider',
        scenario => {
            expect(getStakedBalance(createExternalProduct(), scenario)).toBeNull();
        },
    );

    it('owns every pool when no provider is managed', () => {
        expect(getStakedBalance(createExternalProduct([]), 'everstake')).toBe('1000000000');
    });

    it('does not bound a stake', () => {
        expect(() =>
            createExternalProduct().getAmountBounds({
                account,
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED));
    });

    it('has no operations yet', async () => {
        await expect(
            createExternalProduct().composeStep({
                account,
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_NOT_IMPLEMENTED));
    });
});
