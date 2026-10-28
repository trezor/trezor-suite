import { useCallback } from 'react';

import {
    type DashboardReceiveModalEventSource,
    type DashboardReceiveModalOptionsEventOption,
    type DashboardSendModalEventSource,
    type DashboardSendModalOptionsEventOption,
    events,
    injectDesktopAnalytics,
} from '@suite/analytics';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

export type GlobalSendReceiveSource = DashboardSendModalEventSource &
    DashboardReceiveModalEventSource;

export const useGlobalSendReceiveAnalytics = () => {
    const { analytics } = useServices(injectDesktopAnalytics);
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

    const reportOpen = (
        modal: NonNullable<GlobalSendReceiveType>,
        source: GlobalSendReceiveSource,
    ) => {
        switch (modal) {
            case 'send':
                analytics.report({
                    type: events.dashboardSendModalEvent.name,
                    payload: { source },
                });
                break;
            case 'receive':
                analytics.report({
                    type: events.dashboardReceiveModalEvent.name,
                    payload: { source },
                });
                break;
            default:
                exhaustive(modal);
        }
    };

    const sendAnalytics = {
        account: (filledSearch: boolean) => reportSend('account', filledSearch),
        close: (filledSearch: boolean) => reportSend('close', filledSearch),
    };

    const receiveAnalytics = {
        account: (filledSearch: boolean) => reportReceive('account', filledSearch),
        close: (filledSearch: boolean) => reportReceive('close', filledSearch),
    };

    return { reportOpen, reportSend, reportReceive, sendAnalytics, receiveAnalytics };
};
