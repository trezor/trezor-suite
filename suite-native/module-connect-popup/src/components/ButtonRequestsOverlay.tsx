import { useSelector } from 'react-redux';

import { selectDevice } from '@suite-common/wallet-core';
import { Box, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage } from '@suite-native/device';
import { ButtonRequest } from '@suite-common/suite-types';
import { Translation } from '@suite-native/intl';

export const ButtonRequestsOverlay = () => {
    const selectedDevice = useSelector(selectDevice);

    if (!selectedDevice?.buttonRequests || selectedDevice.buttonRequests.length === 0) {
        return null;
    }

    const getButtonRequestComponent = (request: ButtonRequest) => {
        if (request.code === 'ButtonRequest_Address') {
            return (
                <Box paddingBottom="sp32" key={request.code}>
                    <Text variant="body">{(request as any).data.address}</Text>
                </Box>
            );
        }

        return null;
    };

    return (
        <VStack spacing="sp24" alignItems="center" justifyContent="center" flex={1} padding="sp8">
            {selectedDevice.buttonRequests.map(request => getButtonRequestComponent(request))}

            <ConfirmOnTrezorImage
                bottomSheetText={
                    <Translation id="moduleConnectPopup.bottomSheets.confirmOnDeviceMessage" />
                }
            />
        </VStack>
    );
};
