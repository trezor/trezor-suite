import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { type StakingEarnItem } from '../types';

type NavigateFunction = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.StakingManagement
>['navigate'];

export const navigateByAccountState = (account: Account, navigate: NavigateFunction) => {
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

export const useStakingPromoNavigation = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();
    const accounts = useSelector(selectVisibleDeviceAccounts);

    const { bottomSheetRef: infoSheetRef, openModal: openInfoModal } = useBottomSheetModal();

    const {
        bottomSheetRef: chooseAccountSheetRef,
        openModal: openChooseAccountModal,
        closeModal: closeChooseAccountModal,
    } = useBottomSheetModal();

    const [chosenAccounts, setChosenAccounts] = useState<Account[]>([]);

    const handleAccountSelected = useCallback(
        (account: Account) => {
            closeChooseAccountModal();
            navigateByAccountState(account, navigation.navigate);
        },
        [closeChooseAccountModal, navigation.navigate],
    );

    const handleStakingPromoPress = useCallback(
        (item: StakingEarnItem) => {
            const accountsForSymbol = accounts.filter(acc => acc.symbol === item.symbol);

            if (accountsForSymbol.length === 0) {
                openInfoModal();

                return;
            }

            if (accountsForSymbol.length === 1) {
                navigateByAccountState(accountsForSymbol[0], navigation.navigate);

                return;
            }

            setChosenAccounts(accountsForSymbol);
            openChooseAccountModal();
        },
        [accounts, navigation.navigate, openInfoModal, openChooseAccountModal],
    );

    return {
        handleStakingPromoPress,
        handleAccountSelected,
        chosenAccounts,
        infoSheetRef,
        chooseAccountSheetRef,
        closeChooseAccountModal,
    };
};
