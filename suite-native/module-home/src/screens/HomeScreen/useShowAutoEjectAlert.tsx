import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';
import { useAtom } from 'jotai';

import {
    deviceActions,
    selectHasRunningDiscovery,
    selectIsDeviceRemembered,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
    toggleAutoEjectThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { CenteredTitleHeader, LottieAnimation, VStack } from '@suite-native/atoms';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    selectShouldShowAutoEjectAlert,
    selectViewOnlyCancelationTimestamp,
    setViewOnlyCancelationTimestamp,
} from '@suite-native/settings';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { useToast } from '@suite-native/toasts';
import { TimerId } from '@trezor/type-utils';

import viewOnlyLottie from '../../assets/view-only-lottie.json';

const SHOW_TIMEOUT = 1500;

const hasAutoEjectAlertBeenDisplayedAtom = atomWithUnecryptedStorage(
    'hasAutoEjectAlertBeenDisplayed',
    false,
);

export const useShowAutoEjectAlert = () => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const isViewOnlyByDefaultEnabled = useFeatureFlag(FeatureFlag.IsViewOnlyByDefaultEnabled);

    const device = useSelector(selectSelectedDevice);
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const viewOnlyCancelationTimestamp = useSelector(selectViewOnlyCancelationTimestamp);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);

    const shouldShowAutoEjectAlert = useSelector(selectShouldShowAutoEjectAlert);

    const [hasAutoEjectAlertBeenDisplayed, setHasAutoEjectAlertBeenDisplayed] = useAtom(
        hasAutoEjectAlertBeenDisplayedAtom,
    );

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
        if (
            isViewOnlyByDefaultEnabled &&
            !hasAutoEjectAlertBeenDisplayed &&
            shouldShowAutoEjectAlert
        ) {
            showAlert({
                appendix: (
                    <VStack alignItems="center" spacing="sp24" testID="@home/alert/view-only">
                        <LottieAnimation source={viewOnlyLottie} />
                        {/*// TODO: different animation when discovery is running*/}
                        <CenteredTitleHeader
                            title={
                                isDiscoveryRunning ? (
                                    'Reconnect your Trezor to finish loading assets '
                                ) : (
                                    <Translation id="moduleSettings.viewOnly.autoEject.alert.title" />
                                )
                            }
                            subtitle={
                                isDiscoveryRunning ? undefined : (
                                    <Translation id="moduleSettings.viewOnly.autoEject.alert.subtitle" />
                                )
                            }
                        />
                    </VStack>
                ),
                primaryButtonTitle: isDiscoveryRunning ? (
                    'Connect'
                ) : (
                    <Translation id="moduleSettings.viewOnly.autoEject.alert.primaryButtonTitle" />
                ),
                onPressPrimaryButton: () => {
                    if (isDiscoveryRunning) {
                        // navigate to connect screen
                    } else {
                        setHasAutoEjectAlertBeenDisplayed(true);
                    }
                },
                secondaryButtonTitle: isDiscoveryRunning ? (
                    'Cancel'
                ) : (
                    <Translation id="moduleSettings.viewOnly.autoEject.alert.secondaryButtonTitle" />
                ),
                onPressSecondaryButton: () => {
                    if (!isDiscoveryRunning) {
                        setHasAutoEjectAlertBeenDisplayed(true);
                        showToast({
                            message: (
                                <Translation id="moduleSettings.viewOnly.autoEject.alert.successToast" />
                            ),
                            variant: 'default',
                        });
                    }
                    dispatch(toggleAutoEjectThunk(!isDiscoveryRunning));
                },
            });
        }
        if (isViewOnlyByDefaultEnabled && !shouldShowAutoEjectAlert) {
            hideAlert();
        }
        // we do not want to listen to discovery state changes here
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dispatch,
        hasAutoEjectAlertBeenDisplayed,
        hideAlert,
        isViewOnlyByDefaultEnabled,
        setHasAutoEjectAlertBeenDisplayed,
        shouldShowAutoEjectAlert,
        showAlert,
        showToast,
    ]);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            let timerId: TimerId;

            const canBeShowed =
                !isDeviceRemembered &&
                isDeviceReadyToUseAndAuthorized &&
                !isPortfolioTrackerDevice &&
                !hasDiscovery &&
                !viewOnlyCancelationTimestamp &&
                !isViewOnlyByDefaultEnabled;

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
            isDeviceReadyToUseAndAuthorized,
            isDeviceRemembered,
            isPortfolioTrackerDevice,
            isViewOnlyByDefaultEnabled,
            showViewOnlyAlert,
            viewOnlyCancelationTimestamp,
        ]),
    );
};
