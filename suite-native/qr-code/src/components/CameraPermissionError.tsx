import { Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type CameraPermissionErrorProps = {
    onPermissionRequest: () => void;
};

const permissionTextContainerStyle = prepareNativeStyle(({ spacings }) => ({
    paddingTop: spacings.extraLarge,
}));

const grantPermissionButtonStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.large,
}));

export const CameraPermissionError = ({ onPermissionRequest }: CameraPermissionErrorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(permissionTextContainerStyle)}>
            <Text textAlign="center">Camera access denied.</Text>
            <Text textAlign="center">Please allow camera access in your device settings.</Text>

            <Button onPress={onPermissionRequest} style={applyStyle(grantPermissionButtonStyle)}>
                Grant permission
            </Button>
        </Box>
    );
};
