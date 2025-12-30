import { useCallback } from 'react';

import { EventType, SuiteDesktopLegacyAnalyticsEvents } from '@suite/analytics';

import { useLegacyAnalytics } from '../../../../../../../support/useAnalytics';

type SendModalEventOptions = Extract<
    SuiteDesktopLegacyAnalyticsEvents,
    { type: EventType.DashboardSendModalOptions }
>['payload']['option'];

type ReceiveModalEventOptions = Extract<
    SuiteDesktopLegacyAnalyticsEvents,
    { type: EventType.DashboardReceiveModalOptions }
>['payload']['option'];

export const useGlobalSendReceiveAnalytics = () => {
    const legacyAnalytics = useLegacyAnalytics();
    const reportSend = useCallback(
        (option: SendModalEventOptions, filledSearch: boolean) => {
            legacyAnalytics.report({
                type: EventType.DashboardSendModalOptions,
                payload: { option, filledSearch },
            });
        },
        [legacyAnalytics],
    );

    const reportReceive = useCallback(
        (option: ReceiveModalEventOptions, filledSearch: boolean) => {
            legacyAnalytics.report({
                type: EventType.DashboardReceiveModalOptions,
                payload: { option, filledSearch },
            });
        },
        [legacyAnalytics],
    );

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
