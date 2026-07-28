import { type YieldFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { type StablecoinYieldNavigationItem } from '../types';
import {
    getYieldVaultDepositableBalance,
    hasPositiveContractTokenBalance,
} from './contractTokenBalanceUtils';

type YieldNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.YieldNavigator
>['navigate'];

export type YieldAccountNavigationDestination =
    | 'account-detail'
    | 'deposit-in-a-nutshell-modal'
    | 'insufficient-balance-screen'
    | 'firmware-update-alert';

export const navigateByYieldAccountState = (
    account: Account,
    item: StablecoinYieldNavigationItem,
    navigate: YieldNavigateFn,
    isFirmwareSupported: (flowType: YieldFlowType) => boolean,
    showFirmwareUpdateAlert: () => void,
): YieldAccountNavigationDestination => {
    const { yieldId, underlyingTokenContract, receiptTokenContract } = item;

    if (receiptTokenContract && hasPositiveContractTokenBalance(account, receiptTokenContract)) {
        navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract: receiptTokenContract,
            closeActionType: 'back',
        });

        return 'account-detail';
    }

    // For a wrapped-native (WETH) vault the wrappable native balance counts in as depositable
    // too, so an account holding only the native asset still routes into the deposit flow.
    const hasDepositableBalance = new BigNumber(
        getYieldVaultDepositableBalance(account, underlyingTokenContract),
    ).gt(0);

    if (hasDepositableBalance) {
        if (!isFirmwareSupported('deposit')) {
            showFirmwareUpdateAlert();

            return 'firmware-update-alert';
        }

        navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey: account.key,
                tokenContract: underlyingTokenContract,
                yieldId,
            },
        });

        return 'deposit-in-a-nutshell-modal';
    }

    navigate(RootStackRoutes.YieldInsufficientBalance, {
        accountKey: account.key,
        tokenContract: underlyingTokenContract,
        yieldId,
    });

    return 'insufficient-balance-screen';
};
