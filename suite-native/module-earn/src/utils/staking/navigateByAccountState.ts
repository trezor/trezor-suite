import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';
import { getMobileStakingSupport } from './mobileStakingSupport';

type StakingNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

export const navigateByAccountState = (account: Account, navigate: StakingNavigateFn): boolean => {
    if (hasAccountActiveStaking(account)) {
        navigate(RootStackRoutes.StakingManagement, { accountKey: account.key });

        return true;
    }

    if (getMobileStakingSupport(account.symbol) !== 'manage') {
        return false;
    }

    navigate(RootStackRoutes.HowStakeWorksScreen, {
        symbol: account.symbol,
        accountKey: account.key,
    });

    return true;
};
