import { type Account } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getStakingLimitsByNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { hasAccountStakedBalance } from './hasAccountStakedBalance';
import { resolveStakingTargetRoute } from './resolveStakingTargetRoute';

type StakingNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

export const navigateByAccountState = (account: Account, navigate: StakingNavigateFn) => {
    if (hasAccountStakedBalance(account)) {
        navigate(resolveStakingTargetRoute(account.symbol), {
            accountKey: account.key,
        });

        return;
    }

    if (isSupportedSolStakingNetworkSymbol(account.symbol)) {
        navigate(RootStackRoutes.HowStakeWorksScreen, {
            symbol: account.symbol,
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
