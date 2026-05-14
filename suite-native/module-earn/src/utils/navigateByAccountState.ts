import { type Account } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

type StakingNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

export const navigateByAccountState = (account: Account, navigate: StakingNavigateFn) => {
    const stakedBalance = getAccountTotalStakingBalance(account);

    if (stakedBalance && stakedBalance !== '0') {
        navigate(RootStackRoutes.StakingManagement, {
            accountKey: account.key,
        });

        return;
    }

    const limits = getStakingLimitsByNetworkSymbol(account.symbol);

    if (!limits) {
        return;
    }

    const formattedBalance = formatNetworkAmount(account.availableBalance, account.symbol);

    if (new BigNumber(formattedBalance).gte(limits.MIN_AMOUNT_FOR_STAKING)) {
        navigate(RootStackRoutes.HowStakeWorksScreen, {
            symbol: account.symbol,
            accountKey: account.key,
        });
    } else {
        navigate(RootStackRoutes.StakingInsufficientBalance, {
            accountKey: account.key,
        });
    }
};
