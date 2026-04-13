import { useState } from 'react';
import { Dimensions } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectIsDeviceInitialized,
    selectIsDeviceProtectedByPassphrase,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceThunk, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { AnimatedVStack, VStack } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    EarnStackRoutes,
    HomeStackRoutes,
    type TabNavigationProp,
    checkIsRouteAnyOf,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AddHiddenWalletButton } from './AddHiddenWalletButton';
import { ConnectButton } from './ConnectButton';
import { DeviceList } from './DeviceList';
import { DeviceManagerModal, MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';
import { DeviceSettingsButton } from './DeviceSettingsButton';
import { DevicesToggleButton } from './DevicesToggleButton';
import { WalletList } from './WalletList';
import { useDeviceManager } from '../hooks/useDeviceManager';

const CONTENT_MAX_HEIGHT = Dimensions.get('window').height * 0.8;
const HEADER_HEIGHT = 86;

const scrollViewStyle = prepareNativeStyle<{ maxHeight: number }>((utils, { maxHeight }) => ({
    gap: utils.spacings.sp12,
    flexGrow: 0,
    maxHeight,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
}));

type NavigationProp = TabNavigationProp<AppTabsParamList, AppTabsRoutes.HomeStack>;

export const DeviceManagerContent = () => {
    const { applyStyle, utils } = useNativeStyles();
    const [isChangeDeviceRequested, setIsChangeDeviceRequested] = useState(false);
    const analytics = useAnalytics();
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isPassphraseEnabledOnDevice = useSelector(selectIsDeviceProtectedByPassphrase);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const device = useSelector(selectSelectedDevice);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);

    const navigation = useNavigation<NavigationProp>();
    const currentRoute = useRoute();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const toggleIsChangeDeviceRequested = () =>
        setIsChangeDeviceRequested(!isChangeDeviceRequested);
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

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

    if (!device) {
        return null;
    }

    // based on DeviceManagerModal header height and top offset
    const scrollViewTopOffset = insets.top + utils.spacings.sp24 + HEADER_HEIGHT;
    const scrollViewMaxHeight = CONTENT_MAX_HEIGHT - scrollViewTopOffset;

    const isAddHiddenWalletButtonVisible =
        !hasDiscovery && device?.connected && isDeviceInitialized && isPassphraseEnabledOnDevice;

    const isDeviceListVisible = isChangeDeviceRequested || isPortfolioTrackerDevice;

    return (
        <DeviceManagerModal
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
            <Animated.ScrollView
                style={applyStyle(scrollViewStyle, { maxHeight: scrollViewMaxHeight })}
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                layout={LinearTransition}
            >
                <VStack spacing="sp24">
                    {isDeviceListVisible && (
                        <DeviceList
                            isVisible={isChangeDeviceRequested || isPortfolioTrackerDevice}
                            onSelectDevice={handleSelectDevice}
                        />
                    )}
                    {!isPortfolioTrackerDevice && !shouldFactoryResetBeVisible && (
                        <AnimatedVStack
                            layout={LinearTransition}
                            marginTop={!isDeviceListVisible ? 'sp12' : undefined}
                        >
                            <WalletList onSelectDevice={handleSelectDevice} />
                            <VStack paddingHorizontal="sp16" paddingBottom="sp16" spacing="sp12">
                                <DeviceSettingsButton />
                                {isAddHiddenWalletButtonVisible && <AddHiddenWalletButton />}
                            </VStack>
                        </AnimatedVStack>
                    )}
                </VStack>
            </Animated.ScrollView>
        </DeviceManagerModal>
    );
};
