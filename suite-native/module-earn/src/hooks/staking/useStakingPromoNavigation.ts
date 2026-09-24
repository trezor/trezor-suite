import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useBottomSheetModal, useBottomSheetModalControls } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';
import { useEarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { navigateByAccountState } from '../../utils/staking/navigateByAccountState';
import { resolveStakingPromoAccounts } from '../../utils/staking/resolveStakingPromoAccounts';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const useStakingPromoNavigation = () => {
    const navigation = useNavigation<NavigationProp>();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const { analytics } = useServices(injectNativeAnalytics);

    const reportStakingNavigate = useStakingNavigateAnalytics();

    const { bottomSheetRef: infoSheetRef, openModal: openInfoSheet } = useBottomSheetModal();

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
    const [pendingEnableSymbol, setPendingEnableSymbol] = useState<NetworkSymbol | null>(null);

    const chooseAccountContinuedRef = useRef(false);
    const enableNetworkContinuedRef = useRef(false);
    const chooseAccountSymbolRef = useRef<NetworkSymbol | null>(null);
    const pendingEnableSymbolRef = useRef<NetworkSymbol | null>(null);

    const onAccountPress = useCallback(
        (account: Account) => {
            chooseAccountContinuedRef.current = true;
            closeSelectAccountSheet();
            reportStakingNavigate(account);

            navigateByAccountState(account, navigation.navigate);
        },
        [closeSelectAccountSheet, navigation.navigate, reportStakingNavigate],
    );

    const onSelectAccountDismiss = useCallback(() => {
        closeSelectAccountSheet(false);

        if (chooseAccountContinuedRef.current) {
            chooseAccountContinuedRef.current = false;

            return;
        }

        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'cancel',
                networkSymbol: chooseAccountSymbolRef.current ?? undefined,
            },
        });
    }, [analytics, closeSelectAccountSheet]);

    const showViewOnlyEnableNetworkAlert = useCallback(
        (symbol: NetworkSymbol) => {
            const networkName = getNetwork(symbol).name;

            showAlert({
                title: translate('earn.earnScreen.enableNetworkModal.viewOnlyAlert.title', {
                    networkName,
                }),
                description: translate(
                    'earn.earnScreen.enableNetworkModal.viewOnlyAlert.description',
                    { networkName },
                ),
                primaryButtonTitle: translate('generic.buttons.gotIt'),
                onPressPrimaryButton: hideAlert,
            });
        },
        [hideAlert, showAlert, translate],
    );

    const onEnableNetworkPress = useCallback(() => {
        if (!pendingEnableSymbol) {
            return;
        }

        enableNetworkContinuedRef.current = true;
        closeEnableNetworkSheet();

        if (isDeviceInViewOnlyMode) {
            showViewOnlyEnableNetworkAlert(pendingEnableSymbol);

            return;
        }

        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning,
            params: {
                networkSymbol: pendingEnableSymbol,
                flowType: 'earn',
                earnFlowParams: { earnType: 'staking' },
            },
        });
    }, [
        pendingEnableSymbol,
        closeEnableNetworkSheet,
        isDeviceInViewOnlyMode,
        showViewOnlyEnableNetworkAlert,
        navigation,
    ]);

    const onEnableNetworkDismiss = useCallback(() => {
        closeEnableNetworkSheet(false);

        if (enableNetworkContinuedRef.current) {
            enableNetworkContinuedRef.current = false;

            return;
        }

        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'cancel',
                networkSymbol: pendingEnableSymbolRef.current ?? undefined,
            },
        });
    }, [analytics, closeEnableNetworkSheet]);

    const onPromoItemPress = useCallback(
        (symbol: NetworkSymbol) => {
            const resolution = resolveStakingPromoAccounts({ symbol, accounts });

            if (resolution.isDesktopOnly) {
                openInfoSheet();

                return;
            }

            if (isPortfolioTrackerDevice) {
                openPortfolioTrackerSheet();

                return;
            }

            const { navigableAccounts } = resolution;

            if (navigableAccounts.length === 0) {
                setPendingEnableSymbol(symbol);
                pendingEnableSymbolRef.current = symbol;
                enableNetworkContinuedRef.current = false;
                openEnableNetworkSheet();

                return;
            }

            const singleAccount = navigableAccounts[0];
            if (navigableAccounts.length === 1 && singleAccount) {
                reportStakingNavigate(singleAccount);
                navigateByAccountState(singleAccount, navigation.navigate);

                return;
            }

            setChosenAccounts(navigableAccounts);
            chooseAccountSymbolRef.current = symbol;
            chooseAccountContinuedRef.current = false;
            openSelectAccountSheet();
        },
        [
            accounts,
            navigation.navigate,
            isPortfolioTrackerDevice,
            openPortfolioTrackerSheet,
            openInfoSheet,
            openSelectAccountSheet,
            openEnableNetworkSheet,
            reportStakingNavigate,
        ],
    );

    return {
        onPromoItemPress,
        onAccountPress,
        onEnableNetworkPress,
        onSelectAccountDismiss,
        onEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        infoSheetRef,
        selectAccountSheetRef,
        enableNetworkSheetRef,
        closeSelectAccountSheet,
    };
};
