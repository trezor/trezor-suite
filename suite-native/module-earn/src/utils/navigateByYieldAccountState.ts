import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type StablecoinYieldNavigationItem } from '../types';
import { hasPositiveContractTokenBalance } from './contractTokenBalanceUtils';

type YieldNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.YieldNavigator
>['navigate'];

export const navigateByYieldAccountState = (
    account: Account,
    item: StablecoinYieldNavigationItem,
    navigate: YieldNavigateFn,
) => {
    const { yieldId, underlyingTokenContract, receiptTokenContract } = item;

    if (receiptTokenContract && hasPositiveContractTokenBalance(account, receiptTokenContract)) {
        navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract: receiptTokenContract,
            closeActionType: 'back',
        });

        return;
    }

    if (hasPositiveContractTokenBalance(account, underlyingTokenContract)) {
        navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey: account.key,
                tokenContract: underlyingTokenContract,
                yieldId,
            },
        });

        return;
    }

    navigate(RootStackRoutes.YieldInsufficientBalance, {
        accountKey: account.key,
        tokenContract: underlyingTokenContract,
        yieldId,
    });
};
