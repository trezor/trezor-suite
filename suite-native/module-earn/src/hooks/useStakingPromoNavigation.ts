import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { useAccountAlerts } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { useEarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { type StakingEarnItem } from '../types';
import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';
import { navigateByAccountState } from '../utils/navigateByAccountState';

export const useStakingPromoNavigation = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const analytics = useAnalytics();

    const reportStakingNavigate = useStakingNavigateAnalytics();

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

    const chooseAccountContinuedRef = useRef(false);
    const enableNetworkContinuedRef = useRef(false);
    const chooseAccountSymbolRef = useRef<NetworkSymbol | null>(null);
    const pendingEnableSymbolRef = useRef<NetworkSymbol | null>(null);

    const handleAccountSelected = useCallback(
        (account: Account) => {
            chooseAccountContinuedRef.current = true;
            closeChooseAccountModal();
            reportStakingNavigate(account);
            navigateByAccountState(account, navigation.navigate);
        },
        [closeChooseAccountModal, navigation.navigate, reportStakingNavigate],
    );

    const handleChooseAccountDismiss = useCallback(() => {
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
    }, [analytics]);

    const handleEnableNetworkPress = useCallback(() => {
        if (!pendingEnableSymbol) {
            return;
        }

        enableNetworkContinuedRef.current = true;
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
    }, [analytics]);

    const handleStakingPromoPress = useCallback(
        (item: StakingEarnItem) => {
            if (!isSupportedEthStakingNetworkSymbol(item.symbol)) {
                openInfoModal();

                return;
            }

            if (isPortfolioTrackerDevice) {
                openPortfolioTrackerSheet();

                return;
            }

            const accountsForSymbol = accounts.filter(acc => acc.symbol === item.symbol);

            if (accountsForSymbol.length === 0) {
                setPendingEnableSymbol(item.symbol);
                pendingEnableSymbolRef.current = item.symbol;
                enableNetworkContinuedRef.current = false;
                openEnableNetworkModal();

                return;
            }

            if (accountsForSymbol.length === 1) {
                reportStakingNavigate(accountsForSymbol[0]);
                navigateByAccountState(accountsForSymbol[0], navigation.navigate);

                return;
            }

            setChosenAccounts(accountsForSymbol);
            chooseAccountSymbolRef.current = item.symbol;
            chooseAccountContinuedRef.current = false;
            openChooseAccountModal();
        },
        [
            accounts,
            navigation.navigate,
            isPortfolioTrackerDevice,
            openPortfolioTrackerSheet,
            openInfoModal,
            openChooseAccountModal,
            openEnableNetworkModal,
            reportStakingNavigate,
        ],
    );

    return {
        handleStakingPromoPress,
        handleAccountSelected,
        handleEnableNetworkPress,
        handleChooseAccountDismiss,
        handleEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        infoSheetRef,
        chooseAccountSheetRef,
        enableNetworkSheetRef,
        closeChooseAccountModal,
    };
};
