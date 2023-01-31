import { AnyAction, createSlice } from '@reduxjs/toolkit';

export type LogEntry = { datetime: string; type: any; payload?: Record<any, any> };

type LogsSliceState = {
    logEntries: LogEntry[];
};

type LogsSliceRootState = {
    logs: LogsSliceState;
};

const logsSliceInitialState: LogsSliceState = {
    logEntries: [],
};

const MAX_ENTRIES = 200;

export const logsSlice = createSlice({
    name: 'logs',
    initialState: logsSliceInitialState,
    reducers: {
        addLog: {
            reducer: (state, action) => {
                state.logEntries.push({
                    ...action.payload.payload,
                });
                if (state.logEntries.length > MAX_ENTRIES) {
                    state.logEntries.shift();
                }
            },
            prepare: (action: AnyAction) => ({
                ...action.payload,
                datetime: new Date().toUTCString(),
            }),
        },
    },
});

export const selectLogs = (state: LogsSliceRootState) => state.logs.logEntries;

export const { addLog } = logsSlice.actions;
