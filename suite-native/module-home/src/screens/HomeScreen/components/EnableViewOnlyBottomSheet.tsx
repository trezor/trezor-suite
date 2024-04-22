import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectDevice,
    selectIsDeviceAuthorized,
    selectIsPortfolioTrackerDevice,
    toggleRememberDevice,
    selectIsDeviceRemembered,
} from '@suite-common/wallet-core';
import { BottomSheet, Box, Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useIsBiometricsInitialSetupFinished } from '@suite-native/biometrics';
import { Translation } from '@suite-native/intl';
import {
    selectViewOnlyCancelationTimestamp,
    setViewOnlyCancelationTimestamp,
} from '@suite-native/module-settings';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
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
    const [isViewOnlyModeFeatureEnabled] = useFeatureFlag(FeatureFlag.IsViewOnlyEnabled);
    const { isBiometricsInitialSetupFinished } = useIsBiometricsInitialSetupFinished();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const device = useSelector(selectDevice);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const viewOnlyCancelationTimestamp = useSelector(selectViewOnlyCancelationTimestamp);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const { showToast } = useToast();
    const [isVisible, setIsVisible] = useState(false);

    // show the bottom sheet if:
    //     View Only feature is enabled
    //     does not have view only mode enabled already
    //     the device is authorized
    //     not a portfolio tracker
    //     the user hasn't made a choice yet
    //     and biometrics initial setup was decided

    const canBeShowed =
        isViewOnlyModeFeatureEnabled &&
        !isDeviceRemembered &&
        isDeviceAuthorized &&
        !isPortfolioTrackerDevice &&
        !viewOnlyCancelationTimestamp &&
        isBiometricsInitialSetupFinished;

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
    };

    const handleEnable = () => {
        setIsVisible(false);
        if (device) {
            showToast({
                variant: 'default',
                message: <Translation id={'moduleSettings.viewOnly.toast.enabled'} />,
                icon: 'check',
            });
            dispatch(toggleRememberDevice({ device }));
        }
    };

    if (!canBeShowed) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={() => {}} isCloseDisplayed={false}>
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
