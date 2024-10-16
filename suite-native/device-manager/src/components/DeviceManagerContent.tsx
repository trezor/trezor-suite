import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VStack, Stack, ACCESSIBILITY_FONTSIZE_MULTIPLIER } from '@suite-native/atoms';
import {
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDevice,
    selectDeviceThunk,
    selectHasDeviceDiscovery,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AddHiddenWalletButton } from './AddHiddenWalletButton';
import { DeviceList } from './DeviceList';
import { DeviceSettingsButton } from './DeviceSettingsButton';
import { DeviceManagerModal, MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';
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

const deviceButtonsStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const DeviceManagerContent = () => {
    const { applyStyle, utils } = useNativeStyles();
    const [isChangeDeviceRequested, setIsChangeDeviceRequested] = useState(false);

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const device = useSelector(selectDevice);
    const { setIsDeviceManagerVisible } = useDeviceManager();

    const toggleIsChangeDeviceRequested = () =>
        setIsChangeDeviceRequested(!isChangeDeviceRequested);
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    const handleSelectDevice = (selectedDevice: TrezorDevice) => {
        dispatch(selectDeviceThunk({ device: selectedDevice }));
        setIsChangeDeviceRequested(false);
        setIsDeviceManagerVisible(false);

        analytics.report({
            type: EventType.DeviceManagerClick,
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

    const isAddHiddenWalletButtonVisible = !hasDiscovery && device?.connected;

    return (
        <DeviceManagerModal
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
            <ScrollView
                style={applyStyle(scrollViewStyle, { maxHeight: scrollViewMaxHeight })}
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
            >
                <DeviceList
                    isVisible={isChangeDeviceRequested || isPortfolioTrackerDevice}
                    onSelectDevice={handleSelectDevice}
                />

                {!isPortfolioTrackerDevice && (
                    <VStack spacing="sp12" paddingTop="sp24">
                        <WalletList onSelectDevice={handleSelectDevice} />
                        <Stack
                            orientation={
                                ACCESSIBILITY_FONTSIZE_MULTIPLIER > 1 ? 'vertical' : 'horizontal'
                            }
                            style={applyStyle(deviceButtonsStyle)}
                        >
                            <DeviceSettingsButton
                                showAsFullWidth={!isAddHiddenWalletButtonVisible}
                            />
                            {isAddHiddenWalletButtonVisible && <AddHiddenWalletButton />}
                        </Stack>
                    </VStack>
                )}
            </ScrollView>
        </DeviceManagerModal>
    );
};
