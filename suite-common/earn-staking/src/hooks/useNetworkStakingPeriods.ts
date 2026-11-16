import { useSelector } from 'react-redux';

import type { NetworkSymbol } from '@trezor/network-module-types';

import { type StakingPeriods, useStakingPeriods } from './useStakingPeriods';
import { selectStakeableStakingProductDescriptorBySymbol } from '../state/stakingAccessSelectors';
import type { StakingRootState } from '../state/stakingReducer';

export const useNetworkStakingPeriods = (networkSymbol: NetworkSymbol | null): StakingPeriods => {
    const productId = useSelector((state: StakingRootState) =>
        networkSymbol === null
            ? null
            : (selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol)?.id ?? null),
    );

    return useStakingPeriods(productId);
};
