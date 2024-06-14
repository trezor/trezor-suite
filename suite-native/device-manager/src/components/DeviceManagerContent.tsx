import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

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
import { DeviceManagerModal } from './DeviceManagerModal';
import { DevicesToggleButton } from './DevicesToggleButton';
import { WalletList } from './WalletList';
import { useDeviceManager } from '../hooks/useDeviceManager';

const deviceButtonsStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.medium,
    paddingBottom: utils.spacings.medium,
}));

export const DeviceManagerContent = () => {
    const { applyStyle } = useNativeStyles();
    const [isChangeDeviceRequested, setIsChangeDeviceRequested] = useState(false);

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const [isPassphraseFeatureEnabled] = useFeatureFlag(FeatureFlag.IsPassphraseEnabled);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const device = useSelector(selectDevice);
    const { setIsDeviceManagerVisible } = useDeviceManager();

    const toggleIsChangeDeviceRequested = () =>
        setIsChangeDeviceRequested(!isChangeDeviceRequested);
    const dispatch = useDispatch();

    const handleSelectDevice = (selectedDevice: TrezorDevice) => {
        dispatch(selectDeviceThunk(selectedDevice));
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
            <VStack spacing={12}>
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
            </VStack>
        </DeviceManagerModal>
    );
};
