import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId, selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type AssetId } from '@suite-common/tokens';
import { changeCoinVisibilityThunk, selectAccounts } from '@suite-common/wallet-core';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';
import { type OnSelectAccount, useAccountAlerts } from '@suite-native/accounts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    type CloseActionType,
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type NavigationProps = StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes>;

type UseReceiveNavigationParams = {
    isReplaceRequired?: boolean;
    closeActionType?: CloseActionType;
};

export const useReceiveNavigation = ({
    isReplaceRequired = false,
    closeActionType = 'back',
}: UseReceiveNavigationParams = {}) => {
    const { dispatch, analytics } = useServices(injectDispatch, injectNativeAnalytics);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();

    const navigation = useNavigation<NavigationProps>();
    const navigationFn = isReplaceRequired ? navigation.replace : navigation.navigate;

    const accounts = useSelector(selectAccounts);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const areDebugOnlyNetworksEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.AreDebugOnlyNetworksEnabled),
    );

    const navigateToReceiveScreen = useCallback(
        (assetId: AssetId) => {
            const { networkSymbol, contractAddress } = assetId;
            const receiveAccounts = filterReceiveAccounts({
                accounts,
                supportedNetworks,
                deviceState: deviceStaticSessionId ?? undefined,
                symbol: networkSymbol,
                isDebug: areDebugOnlyNetworksEnabled,
            });
            if (receiveAccounts.length > 1) {
                navigationFn(ReceiveStackRoutes.ReceiveAccounts, {
                    assetId,
                    closeActionType,
                });
            } else if (receiveAccounts.length === 1) {
                navigationFn(ReceiveStackRoutes.ReceiveAddress, {
                    accountKey: receiveAccounts[0]?.key,
                    tokenContract: contractAddress,
                    closeActionType,
                });
            } else if (isDeviceInViewOnlyMode) {
                showViewOnlyAddAccountAlert();
            } else {
                dispatch(
                    changeCoinVisibilityThunk({
                        symbol: networkSymbol,
                        shouldBeVisible: true,
                        discoveryTrigger: 'add-account',
                    }),
                );
                navigation.navigate(ReceiveStackRoutes.ReceiveDiscovery, { assetId });
            }
        },
        [
            accounts,
            supportedNetworks,
            deviceStaticSessionId,
            areDebugOnlyNetworksEnabled,
            navigationFn,
            closeActionType,
            isDeviceInViewOnlyMode,
            showViewOnlyAddAccountAlert,
            dispatch,
            navigation,
        ],
    );

    const navigateToReceiveAddressScreen: OnSelectAccount = useCallback(
        ({ account, tokenAddress }) => {
            analytics.report({
                type: events.receiveOptionsScreenEvent.name,
                payload: { option: 'account' },
            });
            navigation.navigate(ReceiveStackRoutes.ReceiveAddress, {
                accountKey: account.key,
                tokenContract: tokenAddress,
                closeActionType: 'back',
            });
        },
        [analytics, navigation],
    );

    return { navigateToReceiveScreen, navigateToReceiveAddressScreen };
};
