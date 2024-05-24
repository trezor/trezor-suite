import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectDevice,
    selectIsPortfolioTrackerDevice,
    toggleRememberDevice,
    selectIsDeviceRemembered,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';
import { analytics, EventType } from '@suite-native/analytics';
import { BottomSheet, Box, Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    getIsBiometricsFeatureAvailable,
    useIsBiometricsInitialSetupFinished,
} from '@suite-native/biometrics';
import { Translation } from '@suite-native/intl';
import {
    selectViewOnlyCancelationTimestamp,
    setViewOnlyCancelationTimestamp,
} from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';

import { DisconnectedTrezorSvg } from '../../../assets/DisconnectedTrezorSvg';

const SHOW_TIMEOUT = 1500;

const svgStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.small,
    width: '100%',
    height: 206,
}));

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.medium,
}));

export const EnableViewOnlyBottomSheet = () => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const { isBiometricsInitialSetupFinished } = useIsBiometricsInitialSetupFinished();
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const device = useSelector(selectDevice);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const viewOnlyCancelationTimestamp = useSelector(selectViewOnlyCancelationTimestamp);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const { showToast } = useToast();
    const [isVisible, setIsVisible] = useState(false);
    const [isAvailableBiometrics, setIsAvailableBiometrics] = useState(false);

    useEffect(() => {
        const fetchBiometricsAvailability = async () => {
            const isAvailable = await getIsBiometricsFeatureAvailable();
            setIsAvailableBiometrics(isAvailable);
        };

        fetchBiometricsAvailability();
    }, []);

    // show the bottom sheet if:
    //     View Only feature is enabled
    //     does not have view only mode enabled already
    //     the device is authorized
    //     not a portfolio tracker
    //     discovery has finished
    //     the user hasn't made a choice yet
    //     and biometrics initial setup was decided or biometrics is not available

    const canBeShowed =
        !isDeviceRemembered &&
        isDeviceReadyToUseAndAuthorized &&
        !isPortfolioTrackerDevice &&
        !isDiscoveryActive &&
        !viewOnlyCancelationTimestamp &&
        (isBiometricsInitialSetupFinished || !isAvailableBiometrics);

    useEffect(() => {
        let isMounted = true;
        let timerId: ReturnType<typeof setTimeout>;

        //show after a delay
        if (canBeShowed) {
            timerId = setTimeout(() => {
                if (isMounted) {
                    setIsVisible(true);
                }
            }, SHOW_TIMEOUT);
        }

        return () => {
            clearTimeout(timerId);
            isMounted = false;
        };
    }, [canBeShowed]);

    const handleSetRememberModeOfferChoiceTimestamp = () =>
        dispatch(setViewOnlyCancelationTimestamp(new Date().getTime()));

    const handleCancel = () => {
        setIsVisible(false);
        handleSetRememberModeOfferChoiceTimestamp();
        analytics.report({
            type: EventType.ViewOnlySkipped,
            payload: { action: 'button' },
        });
    };

    const handleClose = () => {
        setIsVisible(false);
        analytics.report({
            type: EventType.ViewOnlySkipped,
            payload: { action: 'close' },
        });
    };

    const handleEnable = () => {
        setIsVisible(false);
        if (device) {
            showToast({
                variant: 'default',
                message: <Translation id="moduleSettings.viewOnly.toast.enabled" />,
                icon: 'check',
            });
            dispatch(toggleRememberDevice({ device }));

            analytics.report({
                type: EventType.ViewOnlyChange,
                payload: { enabled: true, origin: 'bottomSheet' },
            });
        }
    };

    if (!canBeShowed) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={handleClose} isCloseDisplayed={false}>
            <VStack spacing="large" paddingHorizontal="small">
                <Box style={applyStyle(svgStyle)}>
                    <DisconnectedTrezorSvg />
                </Box>
                <CenteredTitleHeader
                    title={<Translation id="moduleHome.rememberModeModal.title" />}
                    subtitle={<Translation id="moduleHome.rememberModeModal.description" />}
                />
                <Box style={applyStyle(buttonWrapperStyle)}>
                    <Button testID="enable-biometrics" onPress={handleEnable}>
                        <Translation id="moduleHome.rememberModeModal.button.enable" />
                    </Button>
                    <Button
                        colorScheme="tertiaryElevation0"
                        testID="skip-view-only-mode"
                        onPress={handleCancel}
                    >
                        <Translation id="moduleHome.rememberModeModal.button.skip" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
