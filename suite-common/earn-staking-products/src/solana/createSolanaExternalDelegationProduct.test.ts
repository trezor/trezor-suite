import { StakingAdapterError } from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaExternalDelegationProduct } from './createSolanaExternalDelegationProduct';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from './solanaDelegationProductInfo';
import {
    STAKING_OPERATION_NOT_IMPLEMENTED,
    STAKING_OPERATION_NOT_SUPPORTED,
} from '../shared/unimplementedStakingOperations';

const account = mockStakingAccount({ symbol: asNetworkSymbol('sol') });

describe('createSolanaExternalDelegationProduct', () => {
    it.each(['sol', 'dsol'])('builds the external product for %s', symbol => {
        const product = createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol(symbol),
        });

        expect(product.descriptor.id).toBe(`${symbol}:${symbol}:external:native`);
    });

    it('answers its product info without a request', async () => {
        const product = createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('sol'),
        });

        await expect(product.fetchProductInfo({})).resolves.toBe(SOLANA_EXTERNAL_PRODUCT_INFO);
    });

    it('bounds no operation', () => {
        const product = createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('sol'),
        });

        expect(() =>
            product.getAmountBounds({ account, position: null, operation: 'stake', options: {} }),
        ).toThrow(new StakingAdapterError(STAKING_OPERATION_NOT_SUPPORTED));
    });

    it('has no operations', async () => {
        const product = createSolanaExternalDelegationProduct({
            networkSymbol: asNetworkSymbol('sol'),
        });

        await expect(
            product.composeStep({
                account,
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_NOT_IMPLEMENTED));
    });
});
