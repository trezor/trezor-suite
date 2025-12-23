import { useCallback } from 'react';

import { EventType, SuiteDesktopLegacyAnalyticsEvents, analytics } from '@suite/analytics';

type SendModalEventOptions = Extract<
    SuiteDesktopLegacyAnalyticsEvents,
    { type: EventType.DashboardSendModalOptions }
>['payload']['option'];

type ReceiveModalEventOptions = Extract<
    SuiteDesktopLegacyAnalyticsEvents,
    { type: EventType.DashboardReceiveModalOptions }
>['payload']['option'];

export const useGlobalSendReceiveAnalytics = () => {
    const reportSend = useCallback((option: SendModalEventOptions, filledSearch: boolean) => {
        analytics.report({
            type: EventType.DashboardSendModalOptions,
            payload: { option, filledSearch },
        });
    }, []);

    const reportReceive = useCallback((option: ReceiveModalEventOptions, filledSearch: boolean) => {
        analytics.report({
            type: EventType.DashboardReceiveModalOptions,
            payload: { option, filledSearch },
        });
    }, []);

    const sendAnalytics = {
        account: (filledSearch: boolean) => reportSend('account', filledSearch),
        close: (filledSearch: boolean) => reportSend('close', filledSearch),
    };

    const receiveAnalytics = {
        account: (filledSearch: boolean) => reportReceive('account', filledSearch),
        close: (filledSearch: boolean) => reportReceive('close', filledSearch),
    };

    return { reportSend, reportReceive, sendAnalytics, receiveAnalytics };
};
