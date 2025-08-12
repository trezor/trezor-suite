import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAtom } from 'jotai';

import { toggleAutoEjectThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { CenteredTitleHeader, LottieAnimation, VStack } from '@suite-native/atoms';
import { isDetoxTestBuild } from '@suite-native/config';
import { Translation } from '@suite-native/intl';
import { selectShouldShowAutoEjectAlert } from '@suite-native/settings';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { useToast } from '@suite-native/toasts';

import viewOnlyLottie from '../../assets/view-only-lottie.json';

const hasAutoEjectAlertBeenDisplayedAtom = atomWithUnecryptedStorage(
    'hasAutoEjectAlertBeenDisplayed',
    false,
);

export const useShowAutoEjectAlert = () => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();

    const shouldShowAutoEjectAlert = useSelector(selectShouldShowAutoEjectAlert);

    const [hasAutoEjectAlertBeenDisplayed, setHasAutoEjectAlertBeenDisplayed] = useAtom(
        hasAutoEjectAlertBeenDisplayedAtom,
    );

    useEffect(() => {
        if (!hasAutoEjectAlertBeenDisplayed && shouldShowAutoEjectAlert && !isDetoxTestBuild()) {
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
                onPressPrimaryButton: () => setHasAutoEjectAlertBeenDisplayed(true),
                secondaryButtonTitle: (
                    <Translation id="moduleSettings.viewOnly.autoEject.alert.secondaryButtonTitle" />
                ),
                onPressSecondaryButton: () => {
                    setHasAutoEjectAlertBeenDisplayed(true);
                    dispatch(toggleAutoEjectThunk());
                    analytics.report({
                        type: EventType.AutoEjectChange,
                        payload: {
                            enabled: true,
                            origin: 'autoEjectAlert',
                        },
                    });
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
        setHasAutoEjectAlertBeenDisplayed,
        shouldShowAutoEjectAlert,
        showAlert,
        showToast,
    ]);
};
