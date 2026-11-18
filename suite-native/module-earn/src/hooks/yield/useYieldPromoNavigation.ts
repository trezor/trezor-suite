import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { type DeviceRootState, selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import {
    type AccountsRootState,
    type YieldPromoListItem,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAccountAlerts } from '@suite-native/accounts';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useBottomSheetModalControls } from '@suite-native/atoms';
import {
    type YieldEntrySheet,
    navigateByYieldAccountState,
    useStablecoinYieldFirmwareUpdateAlert,
    useYieldEntryNavigationAnalytics,
} from '@suite-native/earn';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { useEarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';

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

    const pendingSheetRef = useRef<{ from: YieldEntrySheet; item: YieldPromoListItem } | null>(
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

    const reportYieldEntryNavigation = useYieldEntryNavigationAnalytics();

    const onAccountPress = useCallback(
        (account: Account) => {
            if (!chosenYieldItem) {
                return;
            }

            pendingSheetRef.current = null;
            closeSelectAccountSheet();
            const destination = navigateByYieldAccountState(
                account,
                chosenYieldItem,
                navigation.navigate,
                isFirmwareSupported,
                showFirmwareUpdateAlert,
            );
            reportYieldEntryNavigation({
                destination,
                item: chosenYieldItem,
                from: 'choose-account-sheet',
            });
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

        pendingSheetRef.current = null;
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

    const reportSheetDismiss = useCallback(
        (from: YieldEntrySheet) => {
            const pending = pendingSheetRef.current;
            if (pending?.from !== from) return;
            pendingSheetRef.current = null;
            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'cancel',
                    from,
                    to: 'earn-dashboard',
                    networkSymbol: pending.item.networkSymbol,
                    vaultId: pending.item.yieldId,
                },
            });
        },
        [analytics],
    );

    const onSelectAccountDismiss = useCallback(() => {
        closeSelectAccountSheet(false);
        reportSheetDismiss('choose-account-sheet');
    }, [closeSelectAccountSheet, reportSheetDismiss]);

    const onEnableNetworkDismiss = useCallback(() => {
        closeEnableNetworkSheet(false);
        reportSheetDismiss('enable-network-sheet');
    }, [closeEnableNetworkSheet, reportSheetDismiss]);

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
                pendingSheetRef.current = { from: 'enable-network-sheet', item };
                setPendingEnableYieldItem(item);
                openEnableNetworkSheet();
                reportYieldEntryNavigation({
                    destination: 'enable-network-sheet',
                    item,
                    from: 'earn-dashboard',
                });

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
                reportYieldEntryNavigation({ destination, item, from: 'earn-dashboard' });

                return;
            }

            pendingSheetRef.current = { from: 'choose-account-sheet', item };
            setChosenAccounts(accountsForNetwork);
            setChosenYieldItem(item);
            openSelectAccountSheet();
            reportYieldEntryNavigation({
                destination: 'choose-account-sheet',
                item,
                from: 'earn-dashboard',
            });
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
