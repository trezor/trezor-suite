import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { filterKeysByPartialMatch } from '@suite-native/storage';

import {
    type GraphInstanceId,
    type GraphInstanceStateKey,
    getAccountGraphInstanceId,
    getGraphInstanceStateKey,
    getPortfolioGraphInstanceId,
    isGraphInstanceId,
} from './graphInstances';
import { RefetchGraphThunkStatus } from './graphThunkTypes';
import { refetchGraphThunk } from './graphThunks';
import {
    type StoredFiatGraphPoint,
    type StoredGroupedBalanceMovementEvent,
    type TimeframeHoursValue,
} from './types';

// Default is 720 hours (1 month).
export const DEFAULT_GRAPH_TIMEFRAME_HOURS = 720;

export const getGraphTimeframeOrDefault = (
    timeframeHours: TimeframeHoursValue | undefined,
): TimeframeHoursValue => {
    if (timeframeHours === undefined) return DEFAULT_GRAPH_TIMEFRAME_HOURS;

    return timeframeHours;
};

export type GraphInstanceState = {
    timeframeHours: TimeframeHoursValue;
    isLoading?: boolean;
    error?: string | null;
    points?: StoredFiatGraphPoint[];
    events?: StoredGroupedBalanceMovementEvent[];
};

type Graphs = Partial<Record<GraphInstanceStateKey, GraphInstanceState>>;

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
    if (!isGraphInstanceId(instanceId)) {
        throw new Error('Invalid graph instance ID.');
    }

    const stateKey = getGraphInstanceStateKey(instanceId);
    const graph = state.graphs[stateKey] ?? getDefaultGraphInstanceState();
    state.graphs[stateKey] = graph;

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
            const graph = state.graphs[getGraphInstanceStateKey(instanceId)];

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

                if (action.payload.status !== RefetchGraphThunkStatus.Fetched) {
                    return;
                }

                graphInstance.isLoading = false;
                graphInstance.error = null;
                graphInstance.points = action.payload.points;

                if (action.payload.events) {
                    graphInstance.events = action.payload.events;
                } else {
                    delete graphInstance.events;
                }
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
