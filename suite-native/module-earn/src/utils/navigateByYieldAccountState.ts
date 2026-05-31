import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { type StablecoinYieldNavigationItem } from '../types';

type YieldNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.YieldNavigator
>['navigate'];

const hasPositiveTokenBalance = (account: Account, tokenContract: string | null) => {
    if (!tokenContract) {
        return false;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.some(token => {
            const normalizedAccountTokenContract = getContractAddressForNetworkSymbol(
                account.symbol,
                token.contract,
            );

            return (
                normalizedAccountTokenContract === normalizedContract &&
                new BigNumber(token.balance ?? '0').gt(0)
            );
        }) ?? false
    );
};

export const navigateByYieldAccountState = (
    account: Account,
    item: StablecoinYieldNavigationItem,
    navigate: YieldNavigateFn,
) => {
    const { yieldId, underlyingTokenContract, receiptTokenContract } = item;

    if (receiptTokenContract && hasPositiveTokenBalance(account, receiptTokenContract)) {
        navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract: receiptTokenContract,
            closeActionType: 'back',
        });

        return;
    }

    if (hasPositiveTokenBalance(account, underlyingTokenContract)) {
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
