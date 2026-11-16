import {
    type StakingAccessRootState,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingProductAccess,
} from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export const selectIsStakingManageableSymbol = (
    state: StakingAccessRootState,
    networkSymbol: NetworkSymbol,
): boolean => {
    const descriptor = selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol);

    return (
        descriptor !== null && selectStakingProductAccess(state, descriptor.id).access === 'manage'
    );
};
