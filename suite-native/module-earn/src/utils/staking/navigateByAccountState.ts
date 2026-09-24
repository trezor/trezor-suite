import { type Account } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';

type StakingNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

export const navigateByAccountState = (account: Account, navigate: StakingNavigateFn) => {
    if (hasAccountActiveStaking(account)) {
        navigate(RootStackRoutes.StakingManagement, { accountKey: account.key });

        return;
    }

    if (!isStakingSymbol(account.symbol)) {
        return;
    }

    navigate(RootStackRoutes.HowStakeWorksScreen, {
        symbol: account.symbol,
        accountKey: account.key,
    });
};
