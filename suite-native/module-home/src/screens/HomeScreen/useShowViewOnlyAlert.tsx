import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    deviceActions,
    selectHasRunningDiscovery,
    selectIsDeviceRemembered,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { CenteredTitleHeader, LottieAnimation, VStack } from '@suite-native/atoms';
import { getIsBiometricsFeatureAvailable } from '@suite-native/biometrics';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { selectIsCreatingNewPassphraseWallet } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    selectViewOnlyCancelationTimestamp,
    setViewOnlyCancelationTimestamp,
} from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';
import { TimerId } from '@trezor/type-utils';

import viewOnlyLottie from '../../assets/view-only-lottie.json';

const SHOW_TIMEOUT = 1500;

export const useShowViewOnlyAlert = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { showToast } = useToast();

    const device = useSelector(selectSelectedDevice);
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const viewOnlyCancelationTimestamp = useSelector(selectViewOnlyCancelationTimestamp);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isCreatingNewPassphraseWallet = useSelector(selectIsCreatingNewPassphraseWallet);
    const [isAvailableBiometrics, setIsAvailableBiometrics] = useState(false);

    useEffect(() => {
        const fetchBiometricsAvailability = async () => {
            const isAvailable = await getIsBiometricsFeatureAvailable();
            setIsAvailableBiometrics(isAvailable);
        };

        fetchBiometricsAvailability();
    }, []);

    const handleEnable = useCallback(() => {
        if (device) {
            showToast({
                variant: 'default',
                message: <Translation id="moduleSettings.viewOnly.toast.enabled" />,
                icon: 'check',
            });
            dispatch(deviceActions.rememberDevice({ device, remember: !device.remember }));

            analytics.report({
                type: EventType.ViewOnlyChange,
                payload: { enabled: true, origin: 'bottomSheet' },
            });
        }
    }, [device, dispatch, showToast]);

    const handleSetRememberModeOfferChoiceTimestamp = useCallback(
        () => dispatch(setViewOnlyCancelationTimestamp(new Date().getTime())),
        [dispatch],
    );

    const handleCancel = useCallback(() => {
        handleSetRememberModeOfferChoiceTimestamp();
        analytics.report({
            type: EventType.ViewOnlySkipped,
            payload: { action: 'button' },
        });
    }, [handleSetRememberModeOfferChoiceTimestamp]);

    const showViewOnlyAlert = useCallback(() => {
        showAlert({
            primaryButtonTitle: <Translation id="moduleHome.rememberModeModal.button.enable" />,
            onPressPrimaryButton: handleEnable,
            secondaryButtonTitle: <Translation id="moduleHome.rememberModeModal.button.skip" />,
            onPressSecondaryButton: handleCancel,
            appendix: (
                <VStack alignItems="center" spacing="sp24" testID="@home/alert/view-only">
                    <LottieAnimation source={viewOnlyLottie} />
                    <CenteredTitleHeader
                        title={<Translation id="moduleHome.rememberModeModal.title" />}
                        subtitle={<Translation id="moduleHome.rememberModeModal.description" />}
                    />
                </VStack>
            ),
        });
    }, [showAlert, handleEnable, handleCancel]);

    useEffect(() => {
        let isMounted = true;
        let timerId: TimerId;

        const canBeShowed =
            !isDeviceRemembered &&
            isDeviceReadyToUseAndAuthorized &&
            !isPortfolioTrackerDevice &&
            !hasDiscovery &&
            !viewOnlyCancelationTimestamp &&
            !isCreatingNewPassphraseWallet;

        //show after a delay
        if (canBeShowed) {
            timerId = setTimeout(() => {
                if (isMounted) {
                    showViewOnlyAlert();
                }
            }, SHOW_TIMEOUT);
        }

        return () => {
            clearTimeout(timerId);
            isMounted = false;
        };
    }, [
        hasDiscovery,
        isAvailableBiometrics,
        isDeviceReadyToUseAndAuthorized,
        isDeviceRemembered,
        isPortfolioTrackerDevice,
        showViewOnlyAlert,
        viewOnlyCancelationTimestamp,
        isCreatingNewPassphraseWallet,
    ]);
};
