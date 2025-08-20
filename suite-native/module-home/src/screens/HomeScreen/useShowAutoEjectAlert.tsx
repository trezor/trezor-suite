import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { toggleAutoEjectThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, SuiteNativeAnalyticsEvent, analytics } from '@suite-native/analytics';
import { CenteredTitleHeader, LottieAnimation, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectHasAutoEjectAlertBeenDisplayed,
    selectShouldShowAutoEjectAlert,
    setHasAutoEjectAlertBeenDisplayed,
} from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';

import viewOnlyLottie from '../../assets/view-only-lottie.json';

type AutoEjectModalEvent = Extract<SuiteNativeAnalyticsEvent, { type: EventType.AutoEjectModal }>;

export const useShowAutoEjectAlert = () => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();

    const shouldShowAutoEjectAlert = useSelector(selectShouldShowAutoEjectAlert);
    const hasAutoEjectAlertBeenDisplayed = useSelector(selectHasAutoEjectAlertBeenDisplayed);

    const reportAutoEjectToAnalytics = useCallback(
        (value: AutoEjectModalEvent['payload']['value']) => {
            analytics.report({
                type: EventType.AutoEjectModal,
                payload: { value },
            });
        },
        [],
    );

    useEffect(() => {
        if (!hasAutoEjectAlertBeenDisplayed && shouldShowAutoEjectAlert) {
            showAlert({
                appendix: (
                    <VStack alignItems="center" spacing="sp24" testID="@home/alert/view-only">
                        <LottieAnimation source={viewOnlyLottie} />
                        <CenteredTitleHeader
                            title={
                                <Translation id="moduleSettings.viewOnly.autoEject.alert.title" />
                            }
                            subtitle={
                                <Translation id="moduleSettings.viewOnly.autoEject.alert.subtitle" />
                            }
                        />
                    </VStack>
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSettings.viewOnly.autoEject.alert.primaryButtonTitle" />
                ),
                onPressPrimaryButton: () => {
                    reportAutoEjectToAnalytics('skip');
                    dispatch(setHasAutoEjectAlertBeenDisplayed(true));
                },
                secondaryButtonTitle: (
                    <Translation id="moduleSettings.viewOnly.autoEject.alert.secondaryButtonTitle" />
                ),
                onPressSecondaryButton: () => {
                    dispatch(setHasAutoEjectAlertBeenDisplayed(true));
                    dispatch(toggleAutoEjectThunk());
                    reportAutoEjectToAnalytics('enable');
                    showToast({
                        message: (
                            <Translation id="moduleSettings.viewOnly.autoEject.alert.successToast" />
                        ),
                        variant: 'default',
                    });
                },
            });
        }
        if (!shouldShowAutoEjectAlert) {
            hideAlert();
        }
    }, [
        dispatch,
        hasAutoEjectAlertBeenDisplayed,
        hideAlert,
        reportAutoEjectToAnalytics,
        shouldShowAutoEjectAlert,
        showAlert,
        showToast,
    ]);
};
