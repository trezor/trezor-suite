import React from 'react';

import { PermissionStatus } from 'expo-barcode-scanner';

import { Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type CameraPermissionErrorProps = {
    permissionStatus: PermissionStatus;
    onPermissionRequest: () => void;
};

const permissionTextContainerStyle = prepareNativeStyle(({ spacings }) => ({
    paddingTop: spacings.extraLarge,
}));

const grantPermissionButtonStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.large,
}));

export const CameraPermissionError = ({
    permissionStatus,
    onPermissionRequest,
}: CameraPermissionErrorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(permissionTextContainerStyle)}>
            <Text align="center">Camera access denied. {permissionStatus}</Text>
            {permissionStatus === PermissionStatus.DENIED && (
                <Text align="center">Please allow camera access in your device settings.</Text>
            )}
            {permissionStatus === PermissionStatus.UNDETERMINED && (
                <Text align="center">Please allow camera access to your camera. </Text>
            )}

            <Button onPress={onPermissionRequest} style={applyStyle(grantPermissionButtonStyle)}>
                Grant permission
            </Button>
        </Box>
    );
};
