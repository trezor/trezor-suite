import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { mockSolanaStakingAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { everstakeProvider } from '../../../providers/everstake';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from '../productInfo';
import { createSolanaExternalNativeProduct } from './product';

const account = mockStakingAccount({ symbol: asNetworkSymbol('sol') });

const createExternalProduct = (symbol = 'sol') =>
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol(symbol),
        managedProviders: [everstakeProvider],
    });

describe('createSolanaExternalNativeProduct', () => {
    it.each(['sol', 'dsol'])('builds the external product for %s', symbol => {
        expect(createExternalProduct(symbol).descriptor.id).toBe(
            `${symbol}:${symbol}:external:native`,
        );
    });

    it('answers its product info without a request', async () => {
        await expect(createExternalProduct().fetchProductInfo({})).resolves.toBe(
            SOLANA_EXTERNAL_PRODUCT_INFO,
        );
    });

    it('derives a position from the stake no managed provider owns', () => {
        expect(
            createExternalProduct().getPosition({
                account: mockSolanaStakingAccount('everstakeAndExternal'),
                productInfo: SOLANA_EXTERNAL_PRODUCT_INFO,
                transactions: [],
            }),
        ).toMatchObject({
            productId: 'sol:sol:external:native',
            balances: { staked: '10000000000', withdrawable: '1000000000' },
            operations: [],
        });
    });

    it('leaves the stake of a managed provider alone', () => {
        expect(
            createExternalProduct().getPosition({
                account: mockSolanaStakingAccount('active'),
                productInfo: SOLANA_EXTERNAL_PRODUCT_INFO,
                transactions: [],
            }),
        ).toBeNull();
    });

    it('owns every stake account when no provider is managed', () => {
        const product = createSolanaExternalNativeProduct({
            networkSymbol: asNetworkSymbol('sol'),
            managedProviders: [],
        });

        expect(
            product.getPosition({
                account: mockSolanaStakingAccount('everstakeAndExternal'),
                productInfo: SOLANA_EXTERNAL_PRODUCT_INFO,
                transactions: [],
            })?.balances.staked,
        ).toBe('15000000000');
    });

    it('bounds no operation', () => {
        expect(() =>
            createExternalProduct().getAmountBounds({
                account,
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notSupported));
    });

    it('has no operations', async () => {
        await expect(
            createExternalProduct().composeStep({
                account,
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));
    });
});
