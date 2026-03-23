import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { Box } from '@suite-native/atoms';
import { ConfirmOnTrezorImage } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const overlayStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
}));

export const ButtonRequestsOverlay = () => {
    const { applyStyle } = useNativeStyles();
    const selectedDevice = useSelector(selectSelectedDevice);

    if (!selectedDevice?.buttonRequests || selectedDevice.buttonRequests.length === 0) {
        return null;
    }

    return (
        <Box style={applyStyle(overlayStyle)}>
            <ConfirmOnTrezorImage
                bottomSheetText={
                    <Translation id="moduleConnectPopup.bottomSheets.confirmOnDeviceMessage" />
                }
            />
        </Box>
    );
};
