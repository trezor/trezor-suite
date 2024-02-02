import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';
import { useTranslate, TxKeyPath } from '@suite-native/intl';

import { useIsBiometricsAuthenticationCanceled } from '../biometricsAtoms';
import { BiometricsIcons } from './BiometricsIcons';
import { useBiometricsSettings } from '../useBiometricsSettings';

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

const getBiometricsTranslationKey = ({
    isFacialEnabled,
    isFingerprintEnabled,
}: {
    isFacialEnabled: boolean;
    isFingerprintEnabled: boolean;
}): TxKeyPath => {
    if (Platform.OS === 'ios') {
        return isFacialEnabled ? 'biometrics.ios.faceId' : 'biometrics.ios.touchId';
    }

    if (Platform.OS === 'android') {
        if (isFingerprintEnabled && isFacialEnabled) return 'biometrics.android.combined';

        if (isFingerprintEnabled) return 'biometrics.android.fingerprint';

        if (isFacialEnabled) {
            return 'biometrics.android.facial';
        }
    }

    return 'biometrics.unknown';
};

export const BiometricOverlay = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { isFacialEnabled, isFingerprintEnabled } = useBiometricsSettings();
    const { isBiometricsAuthenticationCanceled, setIsBiometricsAuthenticationCanceled } =
        useIsBiometricsAuthenticationCanceled();

    const handleReenable = () => {
        // Setting this to true lets useBiometrics to ask for biometrics in case it was canceled by user before
        // https://github.com/trezor/trezor-suite/issues/10647
        setIsBiometricsAuthenticationCanceled(false);
    };
    const titleTransKey = getBiometricsTranslationKey({ isFacialEnabled, isFingerprintEnabled });

    return (
        <Box style={applyStyle(overlayWrapperStyle)}>
            <Icon name="trezor" size="extraLarge" color="iconDefault" />
            {isBiometricsAuthenticationCanceled && (
                <TouchableOpacity onPress={handleReenable} style={applyStyle(bottomWrapperStyle)}>
                    <BiometricsIcons iconSize={32} showShadow />
                    <Text color="textPrimaryDefault">{translate(titleTransKey)}</Text>
                </TouchableOpacity>
            )}
        </Box>
    );
};
