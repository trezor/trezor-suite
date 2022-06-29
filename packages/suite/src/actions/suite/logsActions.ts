import { LogEntry } from '@suite-reducers/logsReducer';
import { Action } from '@suite-types';
import { LOGS } from './constants';

export type LogAction = { type: typeof LOGS.ADD; payload: LogEntry };

export const addAction = (
    action: Action,
    payload: Record<string, unknown> | undefined,
): LogAction => ({
    type: LOGS.ADD,
    payload: { datetime: new Date().toUTCString(), type: action.type, payload },
});
