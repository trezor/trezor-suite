import { useSelector } from 'react-redux';

import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type StakingRateResult, useStakingRate } from './useStakingRate';
import {
    type StakingAccountProductRootState,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountProductDescriptor,
} from '../state/stakingAccessSelectors';

export type UseNetworkStakingRateParams = {
    networkSymbol: NetworkSymbol | null;
    accountKey?: AccountKey;
};

// An account is rated on the product of its own position, a network on the product it stakes on.
export const useNetworkStakingRate = ({
    networkSymbol,
    accountKey,
}: UseNetworkStakingRateParams): StakingRateResult => {
    const productId = useSelector((state: StakingAccountProductRootState) => {
        const accountProductId =
            accountKey === undefined
                ? null
                : (selectStakingAccountProductDescriptor(state, accountKey)?.id ?? null);

        if (accountProductId !== null || networkSymbol === null) {
            return accountProductId;
        }

        return selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol)?.id ?? null;
    });

    return useStakingRate({ productId, accountKey });
};
