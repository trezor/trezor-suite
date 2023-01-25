import { AnyAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

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
        addLog: (
            state,
            action: PayloadAction<{
                action: AnyAction;
                payload: Record<string, unknown> | undefined;
            }>,
        ) => {
            state.logEntries.push({
                datetime: new Date().toUTCString(),
                type: action.payload.action.type,
                ...action.payload.payload,
            });
            if (state.logEntries.length > MAX_ENTRIES) {
                state.logEntries.shift();
            }
        },
    },
});

export const selectLogs = (state: LogsSliceRootState) => state.logs.logEntries;

export const { addLog } = logsSlice.actions;
