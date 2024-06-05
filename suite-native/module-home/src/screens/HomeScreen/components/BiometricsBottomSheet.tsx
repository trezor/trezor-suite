import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceAuthorized } from '@suite-common/wallet-core';
import { analytics, EventType } from '@suite-native/analytics';
import { BottomSheet, Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    useIsBiometricsEnabled,
    getIsBiometricsFeatureAvailable,
    useIsBiometricsInitialSetupFinished,
    useBiometricsSettings,
    BiometricsIcon,
} from '@suite-native/biometrics';
import { Translation } from '@suite-native/intl';

const SHOW_TIMEOUT = 1500;

const cardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    padding: utils.spacings.large,
    marginBottom: utils.spacings.large,
    gap: utils.spacings.large,
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
    const { isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished } =
        useIsBiometricsInitialSetupFinished();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { toggleBiometricsOption } = useBiometricsSettings();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);

    const [isVisible, setIsVisible] = useState(false);

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

        if (isDeviceAuthorized) {
            checkBiometrics();
        }

        return () => {
            clearTimeout(timerId);
            isMounted = false;
        };
    }, [isBiometricsOptionEnabled, isBiometricsInitialSetupFinished, isDeviceAuthorized]);

    const handleClose = () => {
        setIsVisible(false);
        setIsBiometricsInitialSetupFinished(true);
    };

    const handleEnable = async () => {
        const result = await toggleBiometricsOption();
        if (result === 'enabled') {
            setIsVisible(false);
            setIsBiometricsInitialSetupFinished(true);
            analytics.report({
                type: EventType.BiometricsChange,
                payload: {
                    enabled: true,
                    origin: 'bottomSheet',
                },
            });
        }
    };

    if (isBiometricsInitialSetupFinished) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={handleClose} isCloseDisplayed={false}>
            <Box style={applyStyle(cardStyle)}>
                <BiometricsIcon />
                <Box style={applyStyle(textContentStyle)}>
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="moduleHome.biometricsModal.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="moduleHome.biometricsModal.description" />
                    </Text>
                </Box>
            </Box>
            <Box style={applyStyle(buttonWrapperStyle)}>
                <Button testID="enable-biometrics" onPress={handleEnable}>
                    <Translation id="moduleHome.biometricsModal.button.enable" />
                </Button>
                <Button
                    colorScheme="tertiaryElevation0"
                    testID="reject-biometrics"
                    onPress={handleClose}
                >
                    <Translation id="moduleHome.biometricsModal.button.later" />
                </Button>
            </Box>
        </BottomSheet>
    );
};
