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
) =>
    Sentry.withScope(scope => {
        const { analytics } = getState();
        const { log } = getState();
        scope.setUser({ id: analytics.instanceId });
        if (attachLog) {
            scope.setExtra('log', { ...log.entries });
        }
        Sentry.captureException(error);
    });
