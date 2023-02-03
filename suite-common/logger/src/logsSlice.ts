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
            prepare: props => ({
                payload: {
                    datetime: new Date().toUTCString(),
                    type: props.type,
                    payload: {
                        ...props.payload,
                    },
                },
            }),
        },
    },
});

export const selectLogs = (state: LogsSliceRootState) => state.logs.logEntries;

export const { addLog } = logsSlice.actions;
