import { useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceStaticSessionId,
    selectDeviceThunk,
    selectInstacelessUnselectedDevices,
    selectIsDeviceConnected,
    selectIsDeviceInitialized,
    selectIsDeviceProtectedByPassphrase,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { AnimatedBox, AnimatedScrollView, Box, VStack } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    EarnStackRoutes,
    HomeStackRoutes,
    type TabNavigationProp,
    checkIsRouteAnyOf,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AddHiddenWalletButton } from './AddHiddenWalletButton';
import { ConnectButton } from './ConnectButton';
import { DeviceList } from './DeviceList';
import { DeviceManagerModal } from './DeviceManagerModal';
import { DeviceSettingsButton } from './DeviceSettingsButton';
import { DevicesToggleButton } from './DevicesToggleButton';
import { WalletList } from './WalletList';
import { useDeviceManager } from '../hooks/useDeviceManager';

const scrollViewStyle = prepareNativeStyle(() => ({
    flexGrow: 0,
    flexShrink: 1,
}));

const deviceListWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
}));

const DEVICE_LIST_ANIMATION_DURATION = 200;

type NavigationProp = TabNavigationProp<AppTabsParamList, AppTabsRoutes.HomeStack>;

export const DeviceManagerContent = () => {
    const { applyStyle } = useNativeStyles();
    const [isChangeDeviceRequested, setIsChangeDeviceRequested] = useState(false);
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const unselectedDevices = useSelector(selectInstacelessUnselectedDevices);
    const isPassphraseEnabledOnDevice = useSelector(selectIsDeviceProtectedByPassphrase);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const navigation = useNavigation<NavigationProp>();
    const currentRoute = useRoute();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const toggleIsChangeDeviceRequested = () =>
        setIsChangeDeviceRequested(!isChangeDeviceRequested);

    const handleSelectDevice = (selectedDevice: TrezorDevice) => {
        const isOnEarnScreenRoute = checkIsRouteAnyOf([EarnStackRoutes.Earn], currentRoute.name);
        const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(selectedDevice);

        // When user selects BTC only device in device switcher, redirect to homescreen out of the earn section.
        if (isOnEarnScreenRoute && isBitcoinOnlyFirmware) {
            navigation.navigate(AppTabsRoutes.HomeStack, { screen: HomeStackRoutes.Home });
        }

        dispatch(selectDeviceThunk({ device: selectedDevice }));
        setIsChangeDeviceRequested(false);
        setIsDeviceManagerVisible(false);

        analytics.report({
            type: events.switcherEvent.name,
            payload: {
                action:
                    selectedDevice.id === PORTFOLIO_TRACKER_DEVICE_ID
                        ? 'portfolioTracker'
                        : 'connectDeviceButton',
            },
        });
    };

    // Kept visible (but disabled) while discovery runs so the button doesn't vanish mid-discovery,
    // mirroring the desktop switch-device behavior.
    const isAddHiddenWalletButtonVisible =
        isDeviceConnected &&
        isDeviceInitialized &&
        deviceStaticSessionId &&
        isPassphraseEnabledOnDevice;

    const isDeviceListVisible =
        (isChangeDeviceRequested || isPortfolioTrackerDevice) && unselectedDevices.length > 0;
    const isWalletListVisible = !isPortfolioTrackerDevice && !shouldFactoryResetBeVisible;
    const deviceListHeight = useSharedValue(0);
    const deviceListAnimatedStyle = useAnimatedStyle(() => ({
        height: withTiming(isDeviceListVisible ? deviceListHeight.get() : 0, {
            duration: DEVICE_LIST_ANIMATION_DURATION,
        }),
        overflow: 'hidden',
    }));

    return (
        <DeviceManagerModal
            hasContent={isDeviceListVisible || isWalletListVisible}
            footer={<ConnectButton onSelectDevice={handleSelectDevice} />}
            customSwitchRightView={
                !isPortfolioTrackerDevice && (
                    <DevicesToggleButton
                        isOpened={isChangeDeviceRequested}
                        onDeviceButtonTap={toggleIsChangeDeviceRequested}
                    />
                )
            }
            onClose={() => setIsChangeDeviceRequested(false)}
        >
            <AnimatedScrollView
                style={applyStyle(scrollViewStyle)}
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
            >
                <AnimatedBox
                    accessibilityElementsHidden={!isDeviceListVisible}
                    importantForAccessibility={isDeviceListVisible ? 'auto' : 'no-hide-descendants'}
                    pointerEvents={isDeviceListVisible ? 'auto' : 'none'}
                    style={deviceListAnimatedStyle}
                >
                    <Box
                        onLayout={event => {
                            deviceListHeight.set(event.nativeEvent.layout.height);
                        }}
                        style={applyStyle(deviceListWrapperStyle)}
                    >
                        <DeviceList
                            onSelectDevice={handleSelectDevice}
                            hasBottomBorder={isWalletListVisible}
                        />
                    </Box>
                </AnimatedBox>
                {isWalletListVisible && (
                    <VStack paddingVertical="sp16" spacing="sp16">
                        {deviceStaticSessionId && (
                            <WalletList onSelectDevice={handleSelectDevice} />
                        )}
                        <VStack paddingHorizontal="sp16" spacing="sp12">
                            <DeviceSettingsButton />
                            {isAddHiddenWalletButtonVisible && (
                                <AddHiddenWalletButton isDisabled={hasRunningDiscovery} />
                            )}
                        </VStack>
                    </VStack>
                )}
            </AnimatedScrollView>
        </DeviceManagerModal>
    );
};
