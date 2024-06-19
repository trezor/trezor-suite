import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HStack, VStack } from '@suite-native/atoms';
import {
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDevice,
    selectDeviceThunk,
    selectIsDeviceDiscoveryActive,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { EventType, analytics } from '@suite-native/analytics';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AddHiddenWalletButton } from './AddHiddenWalletButton';
import { DeviceList } from './DeviceList';
import { DeviceInfoButton } from './DeviceInfoButton';
import { DeviceManagerModal, MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';
import { DevicesToggleButton } from './DevicesToggleButton';
import { WalletList } from './WalletList';
import { useDeviceManager } from '../hooks/useDeviceManager';

const CONTENT_MAX_HEIGHT = Dimensions.get('window').height * 0.8;
const HEADER_HEIGHT = 86;

const scrollViewStyle = prepareNativeStyle<{ maxHeight: number }>((_, { maxHeight }) => ({
    gap: 12,
    flexGrow: 0,
    maxHeight,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
}));

const deviceButtonsStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.medium,
    paddingBottom: utils.spacings.medium,
}));

export const DeviceManagerContent = () => {
    const { applyStyle, utils } = useNativeStyles();
    const [isChangeDeviceRequested, setIsChangeDeviceRequested] = useState(false);

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const [isPassphraseFeatureEnabled] = useFeatureFlag(FeatureFlag.IsPassphraseEnabled);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
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
    const scrollViewTopOffset = insets.top + utils.spacings.large + HEADER_HEIGHT;
    const scrollViewMaxHeight = CONTENT_MAX_HEIGHT - scrollViewTopOffset;

    const isAddHiddenWalletButtonVisible =
        isPassphraseFeatureEnabled && !isDiscoveryActive && device?.connected;

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
                    <VStack spacing={12} paddingTop="large">
                        <WalletList onSelectDevice={handleSelectDevice} />
                        <HStack style={applyStyle(deviceButtonsStyle)}>
                            <DeviceInfoButton showAsFullWidth={!isAddHiddenWalletButtonVisible} />
                            {isAddHiddenWalletButtonVisible && <AddHiddenWalletButton />}
                        </HStack>
                    </VStack>
                )}
            </ScrollView>
        </DeviceManagerModal>
    );
};
