import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAccountAlerts } from '@suite-native/accounts';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type BottomSheetModalRef, useBottomSheetModal } from '@suite-native/atoms';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useEarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { type ChooseAccountTokenBalance, type StablecoinYieldPromoNavigationItem } from '../types';
import { useStablecoinYieldFirmwareUpdateAlert } from './useStablecoinYieldFirmwareUpdateAlert';
import {
    type YieldAccountNavigationDestination,
    navigateByYieldAccountState,
} from '../utils/navigateByYieldAccountState';

type UseStablecoinYieldPromoNavigationReturn = {
    handleStablecoinYieldPromoPress: (item: StablecoinYieldPromoNavigationItem) => void;
    handleAccountSelected: (account: Account) => void;
    handleEnableNetworkPress: () => void;
    chosenAccounts: Account[];
    pendingEnableSymbol: NetworkSymbol | null;
    chooseAccountSheetRef: BottomSheetModalRef;
    enableNetworkSheetRef: BottomSheetModalRef;
    closeChooseAccountModal: () => void;
    chooseAccountTokenBalance?: ChooseAccountTokenBalance;
};

export const useStablecoinYieldPromoNavigation = (): UseStablecoinYieldPromoNavigationReturn => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>>();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();

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
    const chooseAccountTokenBalance = chosenYieldItem
        ? {
              tokenContractAddress: chosenYieldItem.underlyingTokenContract,
              tokenSymbol: chosenYieldItem.tokenSymbol,
          }
        : undefined;

    const reportYieldEntryNavigation = useCallback(
        (
            destination: YieldAccountNavigationDestination | 'choose-account-sheet',
            item: StablecoinYieldPromoNavigationItem,
            from: 'earn-dashboard' | 'choose-account-sheet',
        ) => {
            if (destination === 'firmware-update-alert') {
                analytics.report({
                    type: events.yieldDepositEvent.name,
                    payload: {
                        action: 'continue',
                        type: 'firmware-upgrade-needed-modal',
                        networkSymbol: item.networkSymbol,
                        vaultId: item.yieldId,
                    },
                });

                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from,
                    to: destination,
                    networkSymbol: item.networkSymbol,
                    vaultId: item.yieldId,
                },
            });
        },
        [analytics],
    );

    const handleAccountSelected = useCallback(
        (account: Account) => {
            if (!chosenYieldItem) {
                return;
            }

            closeChooseAccountModal();
            const destination = navigateByYieldAccountState(
                account,
                chosenYieldItem,
                navigation.navigate,
                isFirmwareSupported,
                showFirmwareUpdateAlert,
            );
            reportYieldEntryNavigation(destination, chosenYieldItem, 'choose-account-sheet');
        },
        [
            chosenYieldItem,
            closeChooseAccountModal,
            isFirmwareSupported,
            navigation.navigate,
            reportYieldEntryNavigation,
            showFirmwareUpdateAlert,
        ],
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
                const destination = navigateByYieldAccountState(
                    singleAccount,
                    item,
                    navigation.navigate,
                    isFirmwareSupported,
                    showFirmwareUpdateAlert,
                );
                reportYieldEntryNavigation(destination, item, 'earn-dashboard');

                return;
            }

            setChosenAccounts(accountsForNetwork);
            setChosenYieldItem(item);
            openChooseAccountModal();
            reportYieldEntryNavigation('choose-account-sheet', item, 'earn-dashboard');
        },
        [
            accounts,
            isFirmwareSupported,
            isPortfolioTrackerDevice,
            navigation.navigate,
            openChooseAccountModal,
            openEnableNetworkModal,
            openPortfolioTrackerSheet,
            reportYieldEntryNavigation,
            showFirmwareUpdateAlert,
        ],
    );

    return {
        handleStablecoinYieldPromoPress,
        handleAccountSelected,
        handleEnableNetworkPress,
        chosenAccounts,
        pendingEnableSymbol,
        chooseAccountSheetRef,
        enableNetworkSheetRef,
        closeChooseAccountModal,
        chooseAccountTokenBalance,
    };
};
