import { useCallback, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type DeviceRootState, selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
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
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';
import { useEarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { navigateByAccountState } from '../../utils/staking/navigateByAccountState';
import {
    type NavigableStakingSupport,
    resolveStakingPromoAccounts,
} from '../../utils/staking/resolveStakingPromoAccounts';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const useStakingPromoNavigation = () => {
    const store = useStore<AccountsRootState & DeviceRootState>();
    const navigation = useNavigation<NavigationProp>();
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
    const [chosenAccountsSupport, setChosenAccountsSupport] =
        useState<NavigableStakingSupport>('manage');
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

    const showViewOnlyStakingAlert = useCallback(
        (symbol: NetworkSymbol) => {
            const networkName = getNetwork(symbol).name;

            showAlert({
                title: translate('earn.earnScreen.viewOnlyStakingAlert.title'),
                description: translate('earn.earnScreen.viewOnlyStakingAlert.description', {
                    networkName,
                }),
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
            const accounts = selectVisibleDeviceAccounts(store.getState());
            const resolution = resolveStakingPromoAccounts({
                symbol,
                accounts,
                isDeviceInViewOnlyMode,
            });

            if (resolution.type === 'desktop-only') {
                openInfoSheet();

                return;
            }

            if (isPortfolioTrackerDevice) {
                openPortfolioTrackerSheet();

                return;
            }

            switch (resolution.type) {
                case 'enable-network':
                    setPendingEnableSymbol(symbol);
                    pendingEnableSymbolRef.current = symbol;
                    enableNetworkContinuedRef.current = false;
                    openEnableNetworkSheet();

                    return;
                case 'connect-device':
                    showViewOnlyStakingAlert(symbol);

                    return;
                case 'navigate': {
                    const { navigableAccounts, support } = resolution;
                    const singleAccount = navigableAccounts[0];

                    if (navigableAccounts.length === 1 && singleAccount) {
                        reportStakingNavigate(singleAccount);
                        navigateByAccountState(singleAccount, navigation.navigate);

                        return;
                    }

                    setChosenAccounts(navigableAccounts);
                    setChosenAccountsSupport(support);
                    chooseAccountSymbolRef.current = symbol;
                    chooseAccountContinuedRef.current = false;
                    openSelectAccountSheet();

                    return;
                }
                default:
                    exhaustive(resolution);
            }
        },
        [
            store,
            isDeviceInViewOnlyMode,
            navigation.navigate,
            isPortfolioTrackerDevice,
            openPortfolioTrackerSheet,
            openInfoSheet,
            openSelectAccountSheet,
            openEnableNetworkSheet,
            reportStakingNavigate,
            showViewOnlyStakingAlert,
        ],
    );

    const isSelectAccountViewOnly = chosenAccountsSupport === 'view';

    return {
        onPromoItemPress,
        onAccountPress,
        onEnableNetworkPress,
        onSelectAccountDismiss,
        onEnableNetworkDismiss,
        chosenAccounts,
        isSelectAccountViewOnly,
        pendingEnableSymbol,
        infoSheetRef,
        selectAccountSheetRef,
        enableNetworkSheetRef,
        closeSelectAccountSheet,
    };
};
