import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { toggleAutoEjectThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { type AutoEjectModalValue, events } from '@suite-native/analytics';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { selectIsBluetoothDeviceOsUnpairingRequired } from '@suite-native/bluetooth';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import {
    selectHasAutoEjectAlertBeenDisplayed,
    selectShouldShowAutoEjectAlert,
    setHasAutoEjectAlertBeenDisplayed,
} from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';

import { AutoEjectAnimation } from './components/AutoEjectAnimation';

export const useShowAutoEjectAlert = () => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();
    const analytics = useAnalytics();
    const shouldShowAutoEjectAlert = useSelector(selectShouldShowAutoEjectAlert);
    const isBluetoothDeviceOsUnpairingRequired = useSelector(
        selectIsBluetoothDeviceOsUnpairingRequired,
    );
    const hasAutoEjectAlertBeenDisplayed = useSelector(selectHasAutoEjectAlertBeenDisplayed);

    const reportAutoEjectToAnalytics = useCallback(
        (value: AutoEjectModalValue) => {
            analytics.report({
                type: events.autoEjectModalEvent.name,
                payload: { value },
            });
        },
        [analytics],
    );

    useFocusEffect(
        useCallback(() => {
            if (isBluetoothDeviceOsUnpairingRequired) {
                // The alert regarding system unpairing has a higher priority.
                return;
            }
            if (!hasAutoEjectAlertBeenDisplayed && shouldShowAutoEjectAlert) {
                showAlert({
                    type: 'autoEject',
                    appendix: (
                        <VStack alignItems="center" spacing="sp24" testID="@home/alert/view-only">
                            <AutoEjectAnimation />
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
                            intent: 'neutral',
                        });
                    },
                });
            }
            if (!shouldShowAutoEjectAlert) {
                hideAlert('autoEject');
            }
        }, [
            dispatch,
            hasAutoEjectAlertBeenDisplayed,
            hideAlert,
            reportAutoEjectToAnalytics,
            shouldShowAutoEjectAlert,
            isBluetoothDeviceOsUnpairingRequired,
            showAlert,
            showToast,
        ]),
    );
};
