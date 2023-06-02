import { useSelector } from 'react-redux';
import { Platform, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';

import { useDiscreetMode } from '@suite-native/atoms';
import {
    selectBitcoinUnits,
    selectFiatCurrencyCode,
    selectIsOnboardingFinished,
} from '@suite-native/module-settings';
import { useUserColorScheme } from '@suite-native/theme';
import { analytics, EventType } from '@suite-native/analytics';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { selectIsConnectInitialized } from '@suite-native/state';
import { useBiometrics } from '@suite-native/biometrics';

export const useReportAppInitToAnalytics = (appLaunchTimestamp: number) => {
    const [loadDuration, setLoadDuration] = useState<number | null>(null);
    const [initWasReported, setInitWasReported] = useState(false);

    const isConnectInitialized = useSelector(selectIsConnectInitialized);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { userColorScheme } = useUserColorScheme();
    const { isDiscreetMode } = useDiscreetMode();
    const currencyCode = useSelector(selectFiatCurrencyCode);
    const bitcoinUnit = useSelector(selectBitcoinUnits);
    const { isBiometricsOptionEnabled } = useBiometrics();

    useEffect(() => {
        if (isConnectInitialized && !loadDuration) setLoadDuration(Date.now() - appLaunchTimestamp);
    }, [isConnectInitialized, appLaunchTimestamp, loadDuration]);

    useEffect(() => {
        if (isConnectInitialized && isOnboardingFinished && loadDuration && !initWasReported) {
            setInitWasReported(true);
            analytics.report({
                type: EventType.AppReady,
                payload: {
                    appLanguage: 'en',
                    deviceLanguage: undefined,
                    osName: Platform.OS,
                    osVersion: Platform.Version,
                    screenHeight: Dimensions.get('screen').height,
                    screenWidth: Dimensions.get('screen').width,
                    bitcoinUnit: UNIT_ABBREVIATIONS[bitcoinUnit],
                    localCurrency: currencyCode,
                    theme: userColorScheme,
                    discreetMode: isDiscreetMode,
                    loadDuration,
                    isBiometricsEnabled: isBiometricsOptionEnabled,
                },
            });
        }
    }, [
        isConnectInitialized,
        isOnboardingFinished,
        initWasReported,
        currencyCode,
        bitcoinUnit,
        userColorScheme,
        isDiscreetMode,
        loadDuration,
        isBiometricsOptionEnabled,
    ]);
};
