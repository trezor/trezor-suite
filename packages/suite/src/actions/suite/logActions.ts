import { LogEntry } from '@suite-reducers/logReducer';
import { Action, Dispatch, GetState } from '@suite-types';
import * as Sentry from '@sentry/browser';

import { LOG } from './constants';
import { redactDevice, redactCustom, redactAction } from '@suite/utils/suite/logUtils';

export type LogActions =
    | { type: typeof LOG.ADD; payload: LogEntry }
    | { type: typeof LOG.TOGGLE_EXCLUDE_BALANCE_RELATED };

export const addCustom = (action: Action, payload: object | undefined): Action => {
    return {
        type: LOG.ADD,
        payload: {
            time: new Date().getTime(),
            custom: true,
            action: {
                type: action.type,
                payload,
            },
        },
    };
};

export const addAction = (action: Action, options?: { stripPayload: true }): Action => {
    const stripPayload = !!options?.stripPayload;

    if (stripPayload) {
        // log only type
        return {
            type: LOG.ADD,
            payload: {
                time: new Date().getTime(),
                custom: true,
                action: { type: action.type },
            },
        };
    }

    // log full action objct
    return {
        type: LOG.ADD,
        payload: {
            time: new Date().getTime(),
            custom: false,
            action,
        },
    };
};

export const toggleExcludeBalanceRelated = () => ({
    type: LOG.TOGGLE_EXCLUDE_BALANCE_RELATED,
});

export const getLog = () => (_dispatch: Dispatch, getState: GetState) => {
    const { log } = getState();

    if (log.excludeBalanceRelated) {
        return log.entries.map(entry => ({
            ...entry,
            custom: undefined,
            action: entry.custom ? redactCustom(entry.action) : redactAction(entry.action),
        }));
    }
    return log.entries.map(e => ({ ...e, custom: undefined }));
};

export const reportToSentry = (error: any, attachLog = false) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { analytics, log, wallet, suite } = getState();
    Sentry.withScope(scope => {
        scope.setUser({ id: analytics.instanceId });
        if (attachLog) {
            scope.setExtra('device', suite.device ? redactDevice(suite.device) : undefined);
            scope.setExtra('discovery', wallet.discovery);
            scope.setExtra('enabled-coins', wallet.settings.enabledNetworks);
            scope.setExtra('suite-log', log.entries);
        }
        Sentry.captureException(error);
    });
};
