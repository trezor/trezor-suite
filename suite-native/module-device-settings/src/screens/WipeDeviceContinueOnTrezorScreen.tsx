import { useSelector } from 'react-redux';

import { Box } from '@suite-native/atoms';
import {
    ContinueOnTrezorScreenContent,
    selectShouldFactoryResetBeVisible,
} from '@suite-native/device';
import { useHandleHardwareBackNavigation } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const WipeDeviceContinueOnTrezorScreen = () => {
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    useHandleHardwareBackNavigation(() => TrezorConnect.cancel());

    return (
        // In bootloader mode, TrezorConnect.cancel() won't do anything, so we don't want to display header with close action.
        <DeviceInteractionScreenWrapper hasHeader={!shouldFactoryResetBeVisible}>
            <Box marginTop="sp8" flex={1}>
                <ContinueOnTrezorScreenContent />
            </Box>
        </DeviceInteractionScreenWrapper>
    );
};
