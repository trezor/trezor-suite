import { StyleSheet, TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, iconSizes } from '@suite-common/icons';
import { Translation } from '@suite-native/intl';

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
    gap: utils.spacings.extraSmall,
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

    return (
        <>
            <Box style={applyStyle(overlayWrapperStyle)}>
                <Icon name="trezor" size="extraLarge" color="iconDefault" />
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
