import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAccountAlerts } from '@suite-native/accounts';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { isMobileSupportedStakingNetwork } from '../constants';
import { type StakingEarnItem } from '../types';
import { navigateByAccountState } from '../utils/navigateByAccountState';

export const useStakingPromoNavigation = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();

    const { bottomSheetRef: infoSheetRef, openModal: openInfoModal } = useBottomSheetModal();

    const {
        bottomSheetRef: chooseAccountSheetRef,
        openModal: openChooseAccountModal,
        closeModal: closeChooseAccountModal,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: enableNetworkSheetRef,
        openModal: openEnableNetworkModal,
        closeModal: closeEnableNetworkModal,
    } = useBottomSheetModal();

    const [chosenAccounts, setChosenAccounts] = useState<Account[]>([]);
    const [pendingEnableSymbol, setPendingEnableSymbol] = useState<NetworkSymbol | null>(null);

    const handleAccountSelected = useCallback(
        (account: Account) => {
            closeChooseAccountModal();
            navigateByAccountState(account, navigation.navigate);
        },
        [closeChooseAccountModal, navigation.navigate],
    );

    const handleEnableNetworkPress = useCallback(() => {
        if (!pendingEnableSymbol) {
            return;
        }

        closeEnableNetworkModal();

        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return;
        }

        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning,
            params: {
                networkSymbol: pendingEnableSymbol,
                flowType: 'earn',
            },
        });
    }, [
        pendingEnableSymbol,
        closeEnableNetworkModal,
        isDeviceInViewOnlyMode,
        showViewOnlyAddAccountAlert,
        navigation,
    ]);

    const handleStakingPromoPress = useCallback(
        (item: StakingEarnItem) => {
            if (!isMobileSupportedStakingNetwork(item.symbol)) {
                openInfoModal();

                return;
            }

            const accountsForSymbol = accounts.filter(acc => acc.symbol === item.symbol);

            if (accountsForSymbol.length === 0) {
                setPendingEnableSymbol(item.symbol);
                openEnableNetworkModal();

                return;
            }

            if (accountsForSymbol.length === 1) {
                navigateByAccountState(accountsForSymbol[0], navigation.navigate);

                return;
            }

            setChosenAccounts(accountsForSymbol);
            openChooseAccountModal();
        },
        [
            accounts,
            navigation.navigate,
            openInfoModal,
            openChooseAccountModal,
            openEnableNetworkModal,
        ],
    );

    return {
        handleStakingPromoPress,
        handleAccountSelected,
        handleEnableNetworkPress,
        chosenAccounts,
        pendingEnableSymbol,
        infoSheetRef,
        chooseAccountSheetRef,
        enableNetworkSheetRef,
        closeChooseAccountModal,
        closeEnableNetworkModal,
    };
};
