import type {
    GetAmountBoundsParams,
    StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getSolanaExternalDelegationAmountBounds } from './solanaDelegationAmountBounds';
import { createSolanaExternalDelegationDescriptor } from './solanaDelegationDescriptors';
import { SOLANA_EXTERNAL_PRODUCT_INFO } from './solanaDelegationProductInfo';
import { createUnimplementedStakingOperations } from '../shared/unimplementedStakingOperations';

export type CreateSolanaExternalDelegationProductParams = {
    networkSymbol: NetworkSymbol;
};

export const createSolanaExternalDelegationProduct = ({
    networkSymbol,
}: CreateSolanaExternalDelegationProductParams): StakingProductAdapter => {
    const descriptor = createSolanaExternalDelegationDescriptor(networkSymbol);

    const fetchProductInfo = () => Promise.resolve(SOLANA_EXTERNAL_PRODUCT_INFO);

    const getPosition = () => null;

    const getAmountBounds = (params: GetAmountBoundsParams) =>
        getSolanaExternalDelegationAmountBounds(params);

    const operations = createUnimplementedStakingOperations();

    return { descriptor, fetchProductInfo, getPosition, getAmountBounds, ...operations };
};
