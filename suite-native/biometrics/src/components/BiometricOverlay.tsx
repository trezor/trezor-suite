import { StyleSheet } from 'react-native';

import { Box, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { BiometricsIcon } from './BiometricsIcon';

const overlayWrapperStyle = prepareNativeStyle(utils => ({
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.legacyBackgroundTertiaryDefaultOnElevation0,
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

    return (
        <>
            <Box style={applyStyle(overlayWrapperStyle)}>
                <Icon name="trezorLogo" size="extraLarge" color="contentPrimary" />
            </Box>
            {isBiometricsAuthButtonVisible && (
                <PressableOpacity
                    onPress={onBiometricAuthPress}
                    style={applyStyle(bottomWrapperStyle)}
                >
                    <BiometricsIcon iconSize={iconSizes.extraLarge} showShadow />
                    <Text color="contentBrand">
                        <Translation id="biometricsButton" />
                    </Text>
                </PressableOpacity>
            )}
        </>
    );
};
