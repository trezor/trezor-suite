import { useCallback } from 'react';

import {
    type DashboardReceiveModalOptionsEventOption,
    type DashboardSendModalOptionsEventOption,
    events,
} from '@suite/analytics';

import { useAnalytics } from 'src/support/useAnalytics';

export const useGlobalSendReceiveAnalytics = () => {
    const analytics = useAnalytics();
    const reportSend = useCallback(
        (option: DashboardSendModalOptionsEventOption, filledSearch: boolean) => {
            analytics.report({
                type: events.dashboardSendModalOptionsEvent.name,
                payload: { option, filledSearch },
            });
        },
        [analytics],
    );

    const reportReceive = useCallback(
        (option: DashboardReceiveModalOptionsEventOption, filledSearch: boolean) => {
            analytics.report({
                type: events.dashboardReceiveModalOptionsEvent.name,
                payload: { option, filledSearch },
            });
        },
        [analytics],
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
