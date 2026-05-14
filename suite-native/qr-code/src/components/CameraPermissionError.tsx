import { Linking } from 'react-native';

import { Box, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const permissionTextContainerStyle = prepareNativeStyle(({ spacings }) => ({
    paddingTop: spacings.sp32,
}));

const grantPermissionButtonStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.sp24,
}));

export const CameraPermissionError = () => {
    const { applyStyle } = useNativeStyles();

    const navigateToSystemSettings = () => {
        Linking.openSettings();
    };

    return (
        <Box style={applyStyle(permissionTextContainerStyle)}>
            <Text textAlign="center">
                <Translation id="qrCode.deniedWarning.title" />
            </Text>
            <Text textAlign="center">
                <Translation id="qrCode.deniedWarning.description" />
            </Text>

            <Button
                onPress={navigateToSystemSettings}
                style={applyStyle(grantPermissionButtonStyle)}
            >
                <Translation id="qrCode.deniedWarning.grantPermissionButton" />
            </Button>
        </Box>
    );
};
