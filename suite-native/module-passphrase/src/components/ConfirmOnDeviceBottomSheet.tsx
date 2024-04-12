import { BottomSheet, Box, Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { DeviceTS3Svg } from '../assets/DeviceTS3Svg';

const buttonStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

type ConfirmOnDeviceBottomSheetProps = {
    isVisible: boolean;
};

export const ConfirmOnDeviceBottomSheet = ({ isVisible }: ConfirmOnDeviceBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const handleClose = () => {
        // TODO Close bottom sheet and trigger connnect cancel event
    };

    return (
        <BottomSheet isVisible={isVisible} onClose={() => null} isCloseDisplayed={false}>
            <VStack spacing="large" padding="small">
                <DeviceTS3Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
                <Box style={applyStyle(buttonStyle)}>
                    <Button
                        colorScheme="dangerElevation0"
                        testID="passphrase-confrim-on-device-close-button"
                        onPress={handleClose}
                    >
                        <Translation id="modulePassphrase.confirmOnDevice.button" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
