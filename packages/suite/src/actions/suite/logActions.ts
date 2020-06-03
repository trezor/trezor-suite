import { LogEntry } from '@suite-reducers/logReducer';
import { Action, Dispatch, GetState } from '@suite-types';
import * as Sentry from '@sentry/browser';

import { LOG } from './constants';

export type LogActions =
    | { type: typeof LOG.ADD; payload: LogEntry }
    | { type: typeof LOG.TOGGLE_EXCLUDE_BALANCE_RELATED };

export const add = (type: string, message: any): Action => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        type,
        message,
    },
});

export const toggleExcludeBalanceRelated = () => ({
    type: LOG.TOGGLE_EXCLUDE_BALANCE_RELATED,
});

export const reportToSentry = (error: any, attachLog = false) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { analytics, log, wallet, suite } = getState();
    const censoredDevice = {
        ...suite.device,
        id: undefined,
        label: undefined,
        features: {
            ...suite.device?.features,
            // eslint-disable-next-line @typescript-eslint/camelcase
            device_id: undefined,
        },
    };

    Sentry.withScope(scope => {
        scope.setUser({ id: analytics.instanceId });
        if (attachLog) {
            scope.setExtra('device', censoredDevice);
            scope.setExtra('enabled-coins', wallet.settings.enabledNetworks);
            scope.setExtra('suite-log', log.entries);
        }
        Sentry.captureException(error);
    });
};
