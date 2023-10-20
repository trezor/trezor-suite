import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { AuthenticationType, supportedAuthenticationTypesAsync } from 'expo-local-authentication';

import { BottomSheet, Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    useIsBiometricsEnabled,
    getIsBiometricsFeatureAvailable,
    useIsBiometricsInitialSetupFinished,
    useBiometricsSettings,
} from '@suite-native/biometrics';
import { Translation, useTranslate } from '@suite-native/intl';
import { Icon } from '@suite-common/icons/src';

const SHOW_TIMEOUT = 1500;
const IMG_WRAPPER_DIMENSIONS = 88;

const cardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingVertical: utils.spacings.large,
    marginBottom: utils.spacings.large,
    marginTop: utils.spacings.extraLarge,
    gap: utils.spacings.large,
}));

const imageWrapperStyle = prepareNativeStyle(utils => ({
    padding: 12,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    color: utils.colors.iconPrimaryDefault,
    width: IMG_WRAPPER_DIMENSIONS,
    height: IMG_WRAPPER_DIMENSIONS,
}));

const textContentStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.small,
}));

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.medium,
    paddingHorizontal: utils.spacings.small,
}));

export const BiometricsBottomSheet = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished } =
        useIsBiometricsInitialSetupFinished();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { toggleBiometricsOption } = useBiometricsSettings();

    const [isVisible, setIsVisible] = useState(false);
    const [biometricsTypes, setBiometricsTypes] = useState<AuthenticationType[]>([]);

    const isFace = biometricsTypes.filter(biometricsType =>
        [AuthenticationType.FACIAL_RECOGNITION, AuthenticationType.IRIS].includes(biometricsType),
    );

    const iconName = isFace ? 'faceId' : 'fingerprint';

    const title = useMemo(() => {
        if (biometricsTypes.length === 0) {
            return <Translation id="moduleHome.biometricsModal.title.unknown" />;
        }
        if (isFace) {
            return <Translation id="moduleHome.biometricsModal.title.faceId" />;
        }
        if (Platform.OS === 'android') {
            return <Translation id="moduleHome.biometricsModal.title.fingerprint" />;
        }
        return <Translation id="moduleHome.biometricsModal.title.touchId" />;
    }, [biometricsTypes, isFace]);

    useEffect(() => {
        const getSupportedTypes = async () => {
            const biometricsTypesAvailable = await supportedAuthenticationTypesAsync();
            setBiometricsTypes(biometricsTypesAvailable);
        };
        getSupportedTypes();
    }, []);

    useEffect(() => {
        let isMounted = true;
        let timerId: ReturnType<typeof setTimeout>;
        const checkBiometrics = async () => {
            const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();
            if (isBiometricsAvailable && !isBiometricsOptionEnabled) {
                timerId = setTimeout(() => {
                    if (isMounted) {
                        setIsVisible(true);
                    }
                }, SHOW_TIMEOUT);
            }
        };
        checkBiometrics();

        return () => {
            clearTimeout(timerId);
            isMounted = false;
        };
    }, [isBiometricsOptionEnabled, isBiometricsInitialSetupFinished]);

    const handleClose = () => {
        setIsVisible(false);
        setIsBiometricsInitialSetupFinished(true);
    };

    const handleEnable = async () => {
        const result = await toggleBiometricsOption();
        if (result === 'enabled') {
            setIsVisible(false);
            setIsBiometricsInitialSetupFinished(true);
        }
    };

    if (isBiometricsInitialSetupFinished) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={handleClose} isCloseDisplayed={false}>
            <Box style={applyStyle(cardStyle)}>
                <Box style={applyStyle(imageWrapperStyle)}>
                    <Icon name={iconName} color="iconPrimaryDefault" customSize={64} />
                </Box>
                <Box style={applyStyle(textContentStyle)}>
                    <Text variant="titleSmall" textAlign="center">
                        {title}
                    </Text>
                    <Text variant="body" textAlign="center">
                        <Translation id="moduleHome.biometricsModal.description" />
                    </Text>
                </Box>
            </Box>
            <Box style={applyStyle(buttonWrapperStyle)}>
                <Button
                    colorScheme="tertiaryElevation0"
                    data-testID="reject-biometrics"
                    onPress={handleClose}
                >
                    {translate('moduleHome.biometricsModal.button.later')}
                </Button>
                <Button data-testID="enable-biometrics" onPress={handleEnable}>
                    {translate('moduleHome.biometricsModal.button.enable')}
                </Button>
            </Box>
        </BottomSheet>
    );
};
