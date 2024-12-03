import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsDeviceAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { analytics, EventType } from '@suite-native/analytics';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import {
    BiometricsSvg,
    getIsBiometricsFeatureAvailable,
    useBiometricsSettings,
    useIsBiometricsEnabled,
    useIsBiometricsInitialSetupFinished,
} from '@suite-native/biometrics';
import { selectIsCoinEnablingInitFinished } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { TimerId } from '@trezor/type-utils';

const SHOW_TIMEOUT = 1500;

export const useShowBiometricsAlert = () => {
    const { showAlert } = useAlert();

    const { isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished } =
        useIsBiometricsInitialSetupFinished();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { toggleBiometricsOption } = useBiometricsSettings();

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);
    const isCoinEnablingInitFinished = useSelector(selectIsCoinEnablingInitFinished);

    const handleEnable = useCallback(async () => {
        const result = await toggleBiometricsOption();
        if (result === 'enabled') {
            setIsBiometricsInitialSetupFinished(true);
            analytics.report({
                type: EventType.BiometricsChange,
                payload: {
                    enabled: true,
                    origin: 'bottomSheet',
                },
            });
        }
    }, [setIsBiometricsInitialSetupFinished, toggleBiometricsOption]);

    const handleCancel = useCallback(() => {
        setIsBiometricsInitialSetupFinished(true);
    }, [setIsBiometricsInitialSetupFinished]);

    const showBiometricsAlert = useCallback(() => {
        showAlert({
            primaryButtonTitle: <Translation id="moduleHome.biometricsModal.button.enable" />,
            onPressPrimaryButton: handleEnable,
            secondaryButtonTitle: <Translation id="moduleHome.biometricsModal.button.later" />,
            onPressSecondaryButton: handleCancel,
            appendix: (
                <VStack alignItems="center" spacing="sp24">
                    <BiometricsSvg />
                    <CenteredTitleHeader
                        title={<Translation id="moduleHome.biometricsModal.title" />}
                        subtitle={<Translation id="moduleHome.biometricsModal.description" />}
                    />
                </VStack>
            ),
        });
    }, [showAlert, handleEnable, handleCancel]);

    useEffect(() => {
        if (isBiometricsInitialSetupFinished) {
            return;
        }

        let isMounted = true;
        let timerId: TimerId;
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
                        showBiometricsAlert();
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
        isBiometricsInitialSetupFinished,
        isBiometricsOptionEnabled,
        isCoinEnablingInitFinished,
        isDeviceAuthorized,
        isPortfolioTracker,
        showBiometricsAlert,
    ]);
};
