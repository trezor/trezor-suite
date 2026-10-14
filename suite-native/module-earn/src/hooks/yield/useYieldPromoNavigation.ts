import { useCallback, useMemo, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { type DeviceRootState, selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type AccountsRootState, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAccountAlerts } from '@suite-native/accounts';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useBottomSheetModalControls } from '@suite-native/atoms';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { useStablecoinYieldFirmwareUpdateAlert } from './useStablecoinYieldFirmwareUpdateAlert';
import { useEarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { type YieldPromoListItem } from '../../types';
import {
    type YieldAccountNavigationDestination,
    navigateByYieldAccountState,
} from '../../utils/yield/navigateByYieldAccountState';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>;

export const useYieldPromoNavigation = () => {
    const store = useStore<AccountsRootState & DeviceRootState>();
    const navigation = useNavigation<NavigationProp>();
    const { analytics } = useServices(injectNativeAnalytics);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();

    const {
        bottomSheetRef: selectAccountSheetRef,
        showSheet: openSelectAccountSheet,
        hideSheet: closeSelectAccountSheet,
    } = useBottomSheetModalControls();

    const {
        bottomSheetRef: enableNetworkSheetRef,
        showSheet: openEnableNetworkSheet,
        hideSheet: closeEnableNetworkSheet,
    } = useBottomSheetModalControls();

    const [chosenAccounts, setChosenAccounts] = useState<Account[]>([]);
    const [chosenYieldItem, setChosenYieldItem] = useState<YieldPromoListItem | null>(null);
    const [pendingEnableYieldItem, setPendingEnableYieldItem] = useState<YieldPromoListItem | null>(
        null,
    );

    const pendingEnableSymbol = pendingEnableYieldItem?.networkSymbol ?? null;

    const yieldTokenContractAddress = chosenYieldItem?.underlyingTokenContract;
    const yieldTokenDecimals = chosenYieldItem?.token?.decimals;
    const yieldTokenSymbol = chosenYieldItem?.tokenSymbol;

    const selectAccountTokenBalance = useMemo(
        () =>
            yieldTokenContractAddress && yieldTokenDecimals && yieldTokenSymbol
                ? {
                      tokenContractAddress: yieldTokenContractAddress,
                      tokenDecimals: yieldTokenDecimals,
                      tokenSymbol: yieldTokenSymbol,
                  }
                : undefined,
        [yieldTokenContractAddress, yieldTokenDecimals, yieldTokenSymbol],
    );

    const reportYieldEntryNavigation = useCallback(
        (
            destination: YieldAccountNavigationDestination | 'choose-account-sheet',
            item: YieldPromoListItem,
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

    const onAccountPress = useCallback(
        (account: Account) => {
            if (!chosenYieldItem) {
                return;
            }

            closeSelectAccountSheet();
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
            closeSelectAccountSheet,
            isFirmwareSupported,
            navigation.navigate,
            reportYieldEntryNavigation,
            showFirmwareUpdateAlert,
        ],
    );

    const onEnableNetworkPress = useCallback(() => {
        if (!pendingEnableYieldItem) {
            return;
        }

        closeEnableNetworkSheet();

        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return;
        }

        const { networkSymbol, yieldId, underlyingTokenContract, receiptTokenContract } =
            pendingEnableYieldItem;

        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning,
            params: {
                networkSymbol,
                flowType: 'earn',
                earnFlowParams: {
                    earnType: 'yield',
                    yieldId,
                    underlyingTokenContract,
                    receiptTokenContract,
                },
            },
        });
    }, [
        pendingEnableYieldItem,
        closeEnableNetworkSheet,
        isDeviceInViewOnlyMode,
        showViewOnlyAddAccountAlert,
        navigation,
    ]);

    const onSelectAccountDismiss = useCallback(() => {
        closeSelectAccountSheet(false);
    }, [closeSelectAccountSheet]);

    const onEnableNetworkDismiss = useCallback(() => {
        closeEnableNetworkSheet(false);
    }, [closeEnableNetworkSheet]);

    const onPromoItemPress = useCallback(
        (item: YieldPromoListItem) => {
            if (isPortfolioTrackerDevice) {
                openPortfolioTrackerSheet();

                return;
            }

            const accounts = selectVisibleDeviceAccounts(store.getState());

            const accountsForNetwork = accounts.filter(
                account => account.symbol === item.networkSymbol,
            );

            if (accountsForNetwork.length === 0) {
                setPendingEnableYieldItem(item);
                openEnableNetworkSheet();

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
            openSelectAccountSheet();
            reportYieldEntryNavigation('choose-account-sheet', item, 'earn-dashboard');
        },
        [
            store,
            isFirmwareSupported,
            isPortfolioTrackerDevice,
            navigation.navigate,
            openSelectAccountSheet,
            openEnableNetworkSheet,
            openPortfolioTrackerSheet,
            reportYieldEntryNavigation,
            showFirmwareUpdateAlert,
        ],
    );

    return {
        onPromoItemPress,
        onAccountPress,
        onEnableNetworkPress,
        onEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        selectAccountSheetRef,
        enableNetworkSheetRef,
        closeSelectAccountSheet,
        onSelectAccountDismiss,
        selectAccountTokenBalance,
    };
};
