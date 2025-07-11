import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import {
    startDeviceConnectionListening,
    stopDeviceConnectionListening,
} from '@suite-native/device';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BiometricsIcon } from './BiometricsIcon';

const overlayWrapperStyle = prepareNativeStyle(utils => ({
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
}));

const bottomWrapperStyle = prepareNativeStyle(utils => ({
    bottom: 40,
    marginTop: 'auto',
    marginHorizontal: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: utils.spacings.sp4,
}));

type BiometricOverlayProps = {
    isBiometricsAuthButtonVisible: boolean;
    onBiometricAuthPress: () => void;
};

export const BiometricOverlay = ({
    isBiometricsAuthButtonVisible,
    onBiometricAuthPress,
}: BiometricOverlayProps) => {
    const { applyStyle } = useNativeStyles();

    // Ignore device connection in biometrics overlay (note: is this actually necessary?)
    useEffect(() => {
        stopDeviceConnectionListening();

        return () => startDeviceConnectionListening();
    }, []);

    return (
        <>
            <Box style={applyStyle(overlayWrapperStyle)}>
                <Icon name="trezorLogo" size="extraLarge" color="iconDefault" />
            </Box>
            {isBiometricsAuthButtonVisible && (
                <TouchableOpacity
                    onPress={onBiometricAuthPress}
                    style={applyStyle(bottomWrapperStyle)}
                >
                    <BiometricsIcon iconSize={iconSizes.extraLarge} showShadow />
                    <Text color="textPrimaryDefault">
                        <Translation id="biometricsButton" />
                    </Text>
                </TouchableOpacity>
            )}
        </>
    );
};
