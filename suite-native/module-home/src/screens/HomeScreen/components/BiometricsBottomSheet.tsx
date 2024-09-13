import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsDeviceAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
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
import { selectIsCoinEnablingInitFinished } from '@suite-native/discovery';

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

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);
    const isCoinEnablingInitFinished = useSelector(selectIsCoinEnablingInitFinished);

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let timerId: ReturnType<typeof setTimeout>;
        const checkBiometrics = async () => {
            const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

            // if real device is authorized, it is ready only if coin enabling setup was finished.
            // if no real device is authorized, set to true
            const isReadyWithCoinEnabling =
                isDeviceAuthorized && !isPortfolioTracker ? isCoinEnablingInitFinished : true;

            // we need to wait for biometrics and coin enabling init to finish before showing the biometrics modal
            if (isBiometricsAvailable && !isBiometricsOptionEnabled && isReadyWithCoinEnabling) {
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
    }, [
        isBiometricsOptionEnabled,
        isCoinEnablingInitFinished,
        isDeviceAuthorized,
        isPortfolioTracker,
    ]);

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
