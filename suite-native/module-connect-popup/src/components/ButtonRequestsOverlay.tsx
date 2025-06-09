import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const overlayStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    bottom: 0,
    width: '100%',
}));

export const ButtonRequestsOverlay = () => {
    const { applyStyle } = useNativeStyles();
    const selectedDevice = useSelector(selectSelectedDevice);

    if (!selectedDevice?.buttonRequests || selectedDevice.buttonRequests.length === 0) {
        return null;
    }

    return (
        <VStack
            alignItems="center"
            justifyContent="center"
            flex={1}
            style={applyStyle(overlayStyle)}
        >
            <ConfirmOnTrezorImage
                bottomSheetText={
                    <Translation id="moduleConnectPopup.bottomSheets.confirmOnDeviceMessage" />
                }
            />
        </VStack>
    );
};
