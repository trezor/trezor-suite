import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { filterKeysByPartialMatch } from '@suite-native/storage';

import {
    type GraphInstanceId,
    getAccountGraphInstanceId,
    getPortfolioGraphInstanceId,
} from './graphInstances';
import { RefetchGraphThunkStatus } from './graphThunkTypes';
import { refetchGraphThunk } from './graphThunks';
import { type TimeframeHoursValue } from './types';

// Default is 720 hours (1 month).
export const DEFAULT_GRAPH_TIMEFRAME_HOURS = 720;

export type GraphInstanceState = {
    timeframeHours: TimeframeHoursValue;
    isLoading?: boolean;
    error?: string | null;
};

type Graphs = Partial<Record<GraphInstanceId, GraphInstanceState>>;

export type GraphState = {
    graphs: Graphs;
};

export type GraphSliceRootState = {
    graph: GraphState;
};

const getDefaultGraphInstanceState = (): GraphInstanceState => ({
    timeframeHours: DEFAULT_GRAPH_TIMEFRAME_HOURS,
});

const getOrCreateGraphInstance = (
    state: GraphState,
    instanceId: GraphInstanceId,
): GraphInstanceState => {
    const graph = state.graphs[instanceId] ?? getDefaultGraphInstanceState();
    state.graphs[instanceId] = graph;

    return graph;
};

export const graphInitialState: GraphState = {
    graphs: {},
};

const graphSlice = createSlice({
    name: 'graph',
    initialState: graphInitialState,
    reducers: {
        setGraphTimeframe: (
            state,
            {
                payload: { instanceId, timeframeHours },
            }: PayloadAction<{ instanceId: GraphInstanceId; timeframeHours: TimeframeHoursValue }>,
        ) => {
            getOrCreateGraphInstance(state, instanceId).timeframeHours = timeframeHours;
        },
        setPortfolioGraphTimeframe: (
            state: GraphState,
            { payload: { timeframeHours } }: PayloadAction<{ timeframeHours: TimeframeHoursValue }>,
        ) => {
            getOrCreateGraphInstance(state, getPortfolioGraphInstanceId()).timeframeHours =
                timeframeHours;
        },
        setAccountGraphTimeframe: (
            state: GraphState,
            {
                payload: { accountKey, tokenContract, timeframeHours },
            }: PayloadAction<{
                accountKey: AccountKey;
                tokenContract?: TokenAddress;
                timeframeHours: TimeframeHoursValue;
            }>,
        ) => {
            const instanceId = getAccountGraphInstanceId({ accountKey, tokenContract });
            getOrCreateGraphInstance(state, instanceId).timeframeHours = timeframeHours;
        },
        resetGraphRuntimeState: (
            state,
            { payload: { instanceId } }: PayloadAction<{ instanceId: GraphInstanceId }>,
        ) => {
            const graph = state.graphs[instanceId];

            if (!graph) return;

            delete graph.error;
            delete graph.isLoading;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(deviceActions.forgetDevice, (state, action) => {
                const deviceState = action.payload.device.state;
                if (deviceState?.staticSessionId) {
                    state.graphs = filterKeysByPartialMatch(state.graphs, [
                        deviceState.staticSessionId,
                    ]);
                }
            })
            .addCase(deviceActions.setRememberDevice, state => {
                // Persistence of graph depends on device.remember state,
                // but redux-persist is not checking for changes in other reducers.
                // This is a workaround to update redux-persist state.
                state.graphs = { ...state.graphs };
            })
            .addCase(refetchGraphThunk.pending, (state, action) => {
                const graphInstance = getOrCreateGraphInstance(state, action.meta.arg.instanceId);
                graphInstance.isLoading = true;
                graphInstance.error = null;
            })
            .addCase(refetchGraphThunk.fulfilled, (state, action) => {
                const graphInstance = getOrCreateGraphInstance(state, action.meta.arg.instanceId);

                if (
                    action.payload.status === RefetchGraphThunkStatus.WaitingForDiscovery ||
                    action.payload.status === RefetchGraphThunkStatus.Interrupted
                ) {
                    return;
                }

                graphInstance.isLoading = false;
                graphInstance.error = null;
            })
            .addCase(refetchGraphThunk.rejected, (state, action) => {
                const graphInstance = getOrCreateGraphInstance(state, action.meta.arg.instanceId);
                const errorMessage =
                    typeof action.payload === 'string' ? action.payload : action.error.message;

                graphInstance.isLoading = false;
                graphInstance.error = errorMessage ?? null;
            });
    },
});

export const {
    resetGraphRuntimeState,
    setAccountGraphTimeframe,
    setGraphTimeframe,
    setPortfolioGraphTimeframe,
} = graphSlice.actions;
export const graphReducer = graphSlice.reducer;
