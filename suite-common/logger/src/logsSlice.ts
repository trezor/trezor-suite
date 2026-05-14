import { type AnyAction, createSlice } from '@reduxjs/toolkit';

import { type LogEntry } from './types';

type LogsSliceState = {
    logEntries: LogEntry[];
};

export type LogsSliceRootState = {
    logs: LogsSliceState;
};

export const logsSliceInitialState: LogsSliceState = {
    logEntries: [],
};

const MAX_ENTRIES = 200;

export const logsSlice = createSlice({
    name: 'logs',
    initialState: logsSliceInitialState,
    reducers: {
        addLog: {
            reducer: (state, action: AnyAction) => {
                state.logEntries.push({
                    ...action.payload,
                });
                if (state.logEntries.length > MAX_ENTRIES) {
                    state.logEntries.shift();
                }
            },
            // Type of logged action needs to be sent separately (not by spreading action),
            // because if payload would have type property as well,
            // these two would override each other.
            prepare: ({ type, payload }) => ({
                payload: {
                    datetime: new Date().toUTCString(),
                    type,
                    payload,
                },
            }),
        },
    },
});

export const { addLog } = logsSlice.actions;
