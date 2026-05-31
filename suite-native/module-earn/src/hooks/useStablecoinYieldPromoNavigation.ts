import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAccountAlerts } from '@suite-native/accounts';
import { type BottomSheetModalRef, useBottomSheetModal } from '@suite-native/atoms';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useEarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { type StablecoinYieldPromoNavigationItem } from '../types';
import { navigateByYieldAccountState } from '../utils/navigateByYieldAccountState';

type UseStablecoinYieldPromoNavigationReturn = {
    handleStablecoinYieldPromoPress: (item: StablecoinYieldPromoNavigationItem) => void;
    handleAccountSelected: (account: Account) => void;
    handleChooseAccountDismiss: () => void;
    handleEnableNetworkPress: () => void;
    handleEnableNetworkDismiss: () => void;
    chosenAccounts: Account[];
    pendingEnableSymbol: NetworkSymbol | null;
    chooseAccountSheetRef: BottomSheetModalRef;
    enableNetworkSheetRef: BottomSheetModalRef;
    closeChooseAccountModal: () => void;
};

export const useStablecoinYieldPromoNavigation = (): UseStablecoinYieldPromoNavigationReturn => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>>();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();

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
    const [chosenYieldItem, setChosenYieldItem] =
        useState<StablecoinYieldPromoNavigationItem | null>(null);
    const [pendingEnableSymbol, setPendingEnableSymbol] = useState<NetworkSymbol | null>(null);

    const handleChooseAccountDismiss = useCallback(() => {
        setChosenAccounts([]);
        setChosenYieldItem(null);
    }, []);

    const handleAccountSelected = useCallback(
        (account: Account) => {
            if (!chosenYieldItem) {
                return;
            }

            closeChooseAccountModal();
            navigateByYieldAccountState(account, chosenYieldItem, navigation.navigate);
            setChosenAccounts([]);
            setChosenYieldItem(null);
        },
        [chosenYieldItem, closeChooseAccountModal, navigation.navigate],
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

    const handleEnableNetworkDismiss = useCallback(() => {
        setPendingEnableSymbol(null);
    }, []);

    const handleStablecoinYieldPromoPress = useCallback(
        (item: StablecoinYieldPromoNavigationItem) => {
            if (isPortfolioTrackerDevice) {
                openPortfolioTrackerSheet();

                return;
            }

            const accountsForNetwork = accounts.filter(
                account => account.symbol === item.networkSymbol,
            );

            if (accountsForNetwork.length === 0) {
                setPendingEnableSymbol(item.networkSymbol);
                openEnableNetworkModal();

                return;
            }

            const singleAccount = accountsForNetwork[0];
            if (accountsForNetwork.length === 1 && singleAccount) {
                navigateByYieldAccountState(singleAccount, item, navigation.navigate);

                return;
            }

            setChosenAccounts(accountsForNetwork);
            setChosenYieldItem(item);
            openChooseAccountModal();
        },
        [
            accounts,
            isPortfolioTrackerDevice,
            navigation.navigate,
            openChooseAccountModal,
            openEnableNetworkModal,
            openPortfolioTrackerSheet,
        ],
    );

    return {
        handleStablecoinYieldPromoPress,
        handleAccountSelected,
        handleChooseAccountDismiss,
        handleEnableNetworkPress,
        handleEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        chooseAccountSheetRef,
        enableNetworkSheetRef,
        closeChooseAccountModal,
    };
};
