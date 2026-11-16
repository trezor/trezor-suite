import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

export type StakingNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

type NavigateByAccountStateParams = {
    account: Account;
    isStakingActive: boolean;
    isStakingManageable: boolean;
    navigate: StakingNavigateFn;
};

export const navigateByAccountState = ({
    account,
    isStakingActive,
    isStakingManageable,
    navigate,
}: NavigateByAccountStateParams): boolean => {
    if (isStakingActive) {
        navigate(RootStackRoutes.StakingManagement, { accountKey: account.key });

        return true;
    }

    if (!isStakingManageable) {
        return false;
    }

    navigate(RootStackRoutes.HowStakeWorksScreen, {
        symbol: account.symbol,
        accountKey: account.key,
    });

    return true;
};
