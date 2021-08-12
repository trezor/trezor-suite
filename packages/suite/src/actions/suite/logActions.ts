import { LogEntry } from '@suite-reducers/logReducer';
import { Action, Dispatch, GetState } from '@suite-types';
import * as Sentry from '@sentry/browser';
import { LOG } from './constants';
import { redactDevice, redactCustom, redactAction } from '@suite-utils/logUtils';

export type LogAction =
    | { type: typeof LOG.ADD; payload: LogEntry }
    | { type: typeof LOG.TOGGLE_EXCLUDE_BALANCE_RELATED };

export const addCustom = (
    action: Action,
    payload: Record<string, unknown> | undefined,
): LogAction => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        custom: true,
        action: {
            type: action.type,
            payload,
        },
    },
});

export const addAction = (action: Action, options?: { stripPayload: true }): LogAction => {
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

export const toggleExcludeBalanceRelated = (): LogAction => ({
    type: LOG.TOGGLE_EXCLUDE_BALANCE_RELATED,
});

export const getLog =
    (redactSensitiveData = false) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const { log } = getState();

        return log.entries.map(entry => {
            const metaData = {
                type: entry.action.type,
                time: entry.time,
            };

            let redactedAction = entry.action;
            if (redactSensitiveData) {
                redactedAction = entry.custom
                    ? redactCustom(entry.action)
                    : redactAction(entry.action);
            }

            const actionKeys = Object.keys(redactedAction);
            if (actionKeys.length === 1 && actionKeys[0] === 'type') {
                // no payload, print only metadata
                return metaData;
            }
            return {
                ...metaData,
                action: redactedAction,
            };
        });
    };

export const reportToSentry =
    (error: any, attachLog = false) =>
    (dispatch: Dispatch, getState: GetState) => {
        const { analytics, wallet, suite } = getState();
        Sentry.withScope(scope => {
            scope.setUser({ id: analytics.instanceId });
            scope.setExtra('device', suite.device ? redactDevice(suite.device) : undefined);
            scope.setExtra('discovery', wallet.discovery);
            scope.setExtra('enabled-coins', wallet.settings.enabledNetworks);
            if (attachLog) {
                scope.setExtra('suite-log', dispatch(getLog(true)));
            }
            Sentry.captureException(error);
        });
    };
