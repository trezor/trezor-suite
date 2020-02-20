import { LogEntry } from '@suite-reducers/logReducer';
import { Action } from '@suite-types';

import { LOG } from './constants';

export type LogActions = { type: typeof LOG.ADD; payload: LogEntry };

export const add = (type: string, message: any): Action => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        type,
        message,
    },
});
