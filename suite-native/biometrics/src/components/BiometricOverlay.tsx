import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';

import { Box, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { BiometricsIcon } from './BiometricsIcon';
import { authenticateUserThunk } from '../biometricsThunks';

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
};

export const BiometricOverlay = ({ isBiometricsAuthButtonVisible }: BiometricOverlayProps) => {
    const { applyStyle } = useNativeStyles();

    const dispatch = useDispatch();

    const triggerManualAuthentication = () => {
        dispatch(authenticateUserThunk());
    };

    return (
        <>
            <Box style={applyStyle(overlayWrapperStyle)}>
                <Icon name="trezorLogo" size="extraLarge" color="contentPrimary" />
            </Box>
            {isBiometricsAuthButtonVisible && (
                <PressableOpacity
                    onPress={triggerManualAuthentication}
                    style={applyStyle(bottomWrapperStyle)}
                >
                    <BiometricsIcon iconSize={iconSizes.extraLarge} showShadow />
                    <Text color="contentBrand">
                        <Translation id="biometrics.biometricsButton" />
                    </Text>
                </PressableOpacity>
            )}
        </>
    );
};
