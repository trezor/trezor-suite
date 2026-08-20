import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import {
    selectDeviceLanguage,
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { useDiscreetMode } from '@suite-common/discreet-mode';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import {
    selectBaseCurrency,
    selectBitcoinAmountUnit,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { selectIsBiometricsEnabled } from '@suite-native/biometrics';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { selectIsAppReady } from '@suite-native/state';
import { useUserColorScheme } from '@suite-native/theme';

export const useReportAppInitToAnalytics = (appLaunchTimestamp: number) => {
    const [loadDuration, setLoadDuration] = useState<number | null>(null);
    const [initWasReported, setInitWasReported] = useState(false);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const isAppReady = useSelector(selectIsAppReady);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { userColorScheme } = useUserColorScheme();
    const { isDiscreetMode } = useDiscreetMode();
    const currencyCode = useSelector(selectBaseCurrency);
    const bitcoinUnit = useSelector(selectBitcoinAmountUnit);
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);
    const rememberedStandardWallets = useSelector(selectRememberedStandardWalletsCount);
    const rememberedHiddenWallets = useSelector(selectRememberedHiddenWalletsCount);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const appLanguage = useSelector(selectSupportedLanguageLocale);
    const deviceLanguage = useSelector(selectDeviceLanguage);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

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
                    labeling: isSuiteSyncEnabled ? 'suite-sync' : 'off',
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
        isSuiteSyncEnabled,
        analytics,
    ]);
};
