import { useCallback } from 'react';

import { type TradingType } from '@suite-common/trading';
import { useTradingAnalyticReportCallback } from '@suite-native/trading-analytics';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { useDispatchProviderConfirmationStatus } from './useDispatchProviderConfirmationStatus';

export const useBrowserStateChangeCallbacks = (tradingType: TradingType | undefined) => {
    const dispatchProviderConfirmationStatus = useDispatchProviderConfirmationStatus();
    const reportToAnalytics = useTradingAnalyticReportCallback(tradingType);

    const sellOnlyCallback = useCallback(
        (status: ProviderConfirmationStatus) => {
            if (tradingType === 'sell') {
                dispatchProviderConfirmationStatus(status);
            }
        },
        [dispatchProviderConfirmationStatus, tradingType],
    );

    const handleBrowserOpened = useCallback(() => {
        if (tradingType === undefined) {
            return;
        }

        sellOnlyCallback('window_opened');
        reportToAnalytics('webview', 'visit');
    }, [sellOnlyCallback, reportToAnalytics, tradingType]);

    const handleBrowserClosed = useCallback(() => {
        sellOnlyCallback('window_closed_incomplete');
    }, [sellOnlyCallback]);

    const handleBrowserSuccess = useCallback(() => {
        sellOnlyCallback('window_closed_with_success');
    }, [sellOnlyCallback]);

    return {
        handleBrowserOpened,
        handleBrowserClosed,
        handleBrowserSuccess,
    };
};
