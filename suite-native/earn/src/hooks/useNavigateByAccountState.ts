import { useStore } from 'react-redux';

import {
    type StakingAccessRootState,
    type StakingAccountProductRootState,
    selectIsStakingAccountActive,
    selectIsStakingManageableSymbol,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';

import { type StakingNavigateFn, navigateByAccountState } from '../utils/navigateByAccountState';

export const useNavigateByAccountState = () => {
    const store = useStore<StakingAccessRootState & StakingAccountProductRootState>();

    return (account: Account, navigate: StakingNavigateFn): boolean =>
        navigateByAccountState({
            account,
            isStakingActive: selectIsStakingAccountActive(store.getState(), account.key),
            isStakingManageable: selectIsStakingManageableSymbol(store.getState(), account.symbol),
            navigate,
        });
};
