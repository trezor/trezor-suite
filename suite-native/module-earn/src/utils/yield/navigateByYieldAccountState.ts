import { type StablecoinYieldVaultToken, type YieldFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type YieldNavigationItem } from '../../types';
import { hasPositiveContractTokenBalance } from '../earn/contractTokenBalanceUtils';

type YieldNavigateFn = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.YieldNavigator
>['navigate'];

export type YieldAccountNavigationDestination =
    'vault-detail' | 'deposit-in-a-nutshell-modal' | 'firmware-update-alert';

export const navigateByYieldAccountState = (
    account: Account,
    item: YieldNavigationItem,
    navigate: YieldNavigateFn,
    isFirmwareSupported: (
        flowType: YieldFlowType,
        vaultToken?: StablecoinYieldVaultToken,
    ) => boolean,
    showFirmwareUpdateAlert: () => void,
): YieldAccountNavigationDestination => {
    const { yieldId, underlyingTokenContract, receiptTokenContract } = item;

    if (receiptTokenContract && hasPositiveContractTokenBalance(account, receiptTokenContract)) {
        navigate(RootStackRoutes.YieldVaultDetail, {
            accountKey: account.key,
            tokenContract: receiptTokenContract,
        });

        return 'vault-detail';
    }

    if (
        !isFirmwareSupported('deposit', {
            networkSymbol: account.symbol,
            contractAddress: underlyingTokenContract,
        })
    ) {
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
};
