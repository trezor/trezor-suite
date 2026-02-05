import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import {
    selectBaseCurrency,
    selectBitcoinAmountUnit,
    selectDeviceLanguage,
    selectEnabledNetworks,
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { useDiscreetMode } from '@suite-native/atoms';
import { useIsBiometricsEnabled } from '@suite-native/biometrics';
import { selectLocale } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { selectIsAppReady } from '@suite-native/state';
import { useUserColorScheme } from '@suite-native/theme';

export const useReportAppInitToAnalytics = (appLaunchTimestamp: number) => {
    const [loadDuration, setLoadDuration] = useState<number | null>(null);
    const [initWasReported, setInitWasReported] = useState(false);
    const analytics = useAnalytics();
    const isAppReady = useSelector(selectIsAppReady);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { userColorScheme } = useUserColorScheme();
    const { isDiscreetMode } = useDiscreetMode();
    const currencyCode = useSelector(selectBaseCurrency);
    const bitcoinUnit = useSelector(selectBitcoinAmountUnit);
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const rememberedStandardWallets = useSelector(selectRememberedStandardWalletsCount);
    const rememberedHiddenWallets = useSelector(selectRememberedHiddenWalletsCount);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const appLanguage = useSelector(selectLocale);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    useEffect(() => {
        if (isAppReady && !loadDuration) setLoadDuration(Date.now() - appLaunchTimestamp);
    }, [isAppReady, appLaunchTimestamp, loadDuration]);

    useEffect(() => {
        if (isAppReady && isOnboardingFinished && loadDuration && !initWasReported) {
            setInitWasReported(true);
            analytics.report({
                type: events.appReadyEvent.name,
                payload: {
                    appLanguage,
                    deviceLanguage,
                    osName: Platform.OS,
                    osVersion: Platform.Version,
                    screenHeight: Dimensions.get('screen').height,
                    screenWidth: Dimensions.get('screen').width,
                    pixelDensity: PixelRatio.get(),
                    fontScale: PixelRatio.getFontScale(),
                    bitcoinUnit: UNIT_ABBREVIATIONS[bitcoinUnit],
                    localCurrency: currencyCode,
                    theme: userColorScheme,
                    discreetMode: isDiscreetMode,
                    loadDuration,
                    isBiometricsEnabled: isBiometricsOptionEnabled,
                    rememberedStandardWallets,
                    rememberedHiddenWallets,
                    enabledNetworks,
                },
            });
        }
    }, [
        isAppReady,
        isOnboardingFinished,
        initWasReported,
        currencyCode,
        bitcoinUnit,
        userColorScheme,
        isDiscreetMode,
        loadDuration,
        isBiometricsOptionEnabled,
        rememberedStandardWallets,
        rememberedHiddenWallets,
        enabledNetworks,
        appLanguage,
        deviceLanguage,
        analytics,
    ]);
};
