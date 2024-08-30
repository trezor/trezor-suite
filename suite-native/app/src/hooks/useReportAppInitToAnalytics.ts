import { useSelector } from 'react-redux';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { useEffect, useState } from 'react';

import { useDiscreetMode } from '@suite-native/atoms';
import {
    selectBitcoinUnits,
    selectFiatCurrencyCode,
    selectIsOnboardingFinished,
} from '@suite-native/settings';
import { useUserColorScheme } from '@suite-native/theme';
import { analytics, EventType } from '@suite-native/analytics';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { selectIsConnectInitialized } from '@suite-native/state';
import { useIsBiometricsEnabled } from '@suite-native/biometrics';
import {
    selectRememberedStandardWalletsCount,
    selectRememberedHiddenWalletsCount,
} from '@suite-common/wallet-core';
import { selectEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';

export const useReportAppInitToAnalytics = (appLaunchTimestamp: number) => {
    const [loadDuration, setLoadDuration] = useState<number | null>(null);
    const [initWasReported, setInitWasReported] = useState(false);

    const isConnectInitialized = useSelector(selectIsConnectInitialized);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { userColorScheme } = useUserColorScheme();
    const { isDiscreetMode } = useDiscreetMode();
    const currencyCode = useSelector(selectFiatCurrencyCode);
    const bitcoinUnit = useSelector(selectBitcoinUnits);
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const rememberedStandardWallets = useSelector(selectRememberedStandardWalletsCount);
    const rememberedHiddenWallets = useSelector(selectRememberedHiddenWalletsCount);
    const enabledNetworks = useSelector(selectEnabledDiscoveryNetworkSymbols);

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
        isConnectInitialized,
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
    ]);
};
