import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId, selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import type { TradingAssetOption } from '@suite-common/trading';
import { changeCoinVisibilityThunk, selectAccounts } from '@suite-common/wallet-core';
import { toTokenAddress } from '@suite-common/wallet-types';
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
        (asset: TradingAssetOption) => {
            const receiveAccounts = filterReceiveAccounts({
                accounts,
                supportedNetworks,
                deviceState: deviceStaticSessionId ?? undefined,
                symbol: asset.networkSymbol,
                isDebug: areDebugOnlyNetworksEnabled,
            });
            if (receiveAccounts.length > 1) {
                navigationFn(ReceiveStackRoutes.ReceiveAccounts, {
                    asset,
                    closeActionType,
                });
            } else if (receiveAccounts.length === 1) {
                navigationFn(ReceiveStackRoutes.ReceiveAddress, {
                    accountKey: receiveAccounts[0]?.key,
                    tokenContract: asset.contractAddress
                        ? toTokenAddress(asset.contractAddress)
                        : undefined,
                    closeActionType,
                });
            } else if (isDeviceInViewOnlyMode) {
                showViewOnlyAddAccountAlert();
            } else {
                dispatch(
                    changeCoinVisibilityThunk({
                        symbol: asset.networkSymbol,
                        shouldBeVisible: true,
                    }),
                );
                navigation.navigate(ReceiveStackRoutes.ReceiveDiscovery, { asset });
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
