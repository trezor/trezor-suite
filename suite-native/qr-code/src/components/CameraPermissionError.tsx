import { Linking } from 'react-native';

import { Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const permissionTextContainerStyle = prepareNativeStyle(({ spacings }) => ({
    paddingTop: spacings.extraLarge,
}));

const grantPermissionButtonStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.large,
}));

export const CameraPermissionError = () => {
    const { applyStyle } = useNativeStyles();

    const navigateToSystemSettings = () => {
        Linking.openSettings();
    };

    return (
        <Box style={applyStyle(permissionTextContainerStyle)}>
            <Text textAlign="center">Camera access denied.</Text>
            <Text textAlign="center">Please allow camera access in your device settings.</Text>

            <Button
                onPress={navigateToSystemSettings}
                style={applyStyle(grantPermissionButtonStyle)}
            >
                Grant permission
            </Button>
        </Box>
    );
};
