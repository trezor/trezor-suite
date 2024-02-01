import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { analytics, EventType } from '@suite-native/analytics';
import { BottomSheet, Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    useIsBiometricsEnabled,
    getIsBiometricsFeatureAvailable,
    useIsBiometricsInitialSetupFinished,
    useBiometricsSettings,
    BiometricsIcons,
} from '@suite-native/biometrics';
import { Translation, TxKeyPath, useTranslate } from '@suite-native/intl';

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

const getBottomSheetTranslations = ({
    isFacialEnabled,
    isFingerprintEnabled,
}: {
    isFacialEnabled: boolean;
    isFingerprintEnabled: boolean;
}): { titleTransKey: TxKeyPath; descriptionTransKey: TxKeyPath } => {
    if (Platform.OS === 'ios') {
        return isFacialEnabled
            ? {
                  titleTransKey: 'moduleHome.biometricsModal.title.ios.faceId',
                  descriptionTransKey: 'moduleHome.biometricsModal.description.ios.faceId',
              }
            : {
                  titleTransKey: 'moduleHome.biometricsModal.title.ios.touchId',
                  descriptionTransKey: 'moduleHome.biometricsModal.description.ios.touchId',
              };
    }

    if (Platform.OS === 'android') {
        if (isFingerprintEnabled && isFacialEnabled)
            return {
                titleTransKey: 'moduleHome.biometricsModal.title.android.combined',
                descriptionTransKey: 'moduleHome.biometricsModal.description.android.combined',
            };
        if (isFingerprintEnabled)
            return {
                titleTransKey: 'moduleHome.biometricsModal.title.android.fingerprint',
                descriptionTransKey: 'moduleHome.biometricsModal.description.android.fingerprint',
            };

        if (isFacialEnabled)
            return {
                titleTransKey: 'moduleHome.biometricsModal.title.android.facial',
                descriptionTransKey: 'moduleHome.biometricsModal.description.android.facial',
            };
    }

    return {
        titleTransKey: 'moduleHome.biometricsModal.title.unknown',
        descriptionTransKey: 'moduleHome.biometricsModal.description.unknown',
    };
};

export const BiometricsBottomSheet = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished } =
        useIsBiometricsInitialSetupFinished();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { toggleBiometricsOption, isFacialEnabled, isFingerprintEnabled } =
        useBiometricsSettings();

    const [isVisible, setIsVisible] = useState(false);

    const { titleTransKey, descriptionTransKey } = getBottomSheetTranslations({
        isFacialEnabled,
        isFingerprintEnabled,
    });

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
                <BiometricsIcons />
                <Box style={applyStyle(textContentStyle)}>
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id={titleTransKey} />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id={descriptionTransKey} />
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
