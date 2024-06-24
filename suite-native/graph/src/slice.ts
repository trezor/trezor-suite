import { G } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { selectDeviceStatesNotRemembered, filterObjectKeys } from '@suite-native/storage';

import { TimeframeHoursValue } from './types';

// Default is 720 hours (1 month).
const DEFAULT_GRAPH_TIMEFRAME_HOURS = 720;

export interface GraphState {
    portfolioGraphTimeframe: TimeframeHoursValue;
    accountToGraphTimeframeMap: Record<AccountKey, TimeframeHoursValue>;
}

export type GraphSliceRootState = {
    graph: GraphState;
};

export const graphInitialState: GraphState = {
    portfolioGraphTimeframe: DEFAULT_GRAPH_TIMEFRAME_HOURS,
    accountToGraphTimeframeMap: {},
};

export const graphPersistTransform = createTransform<GraphState, GraphState>(
    (inboundState, _, state) => ({
        ...inboundState,
        accountToGraphTimeframeMap: filterObjectKeys(
            inboundState.accountToGraphTimeframeMap,
            selectDeviceStatesNotRemembered(state),
        ),
    }),
    undefined,
    { whitelist: ['graph'] },
);

export const graphSlice = createSlice({
    name: 'graph',
    initialState: graphInitialState,
    reducers: {
        setPortfolioGraphTimeframe: (
            state,
            { payload: { timeframeHours } }: PayloadAction<{ timeframeHours: TimeframeHoursValue }>,
        ) => {
            state.portfolioGraphTimeframe = timeframeHours;
        },
        setAccountGraphTimeframe: (
            state,
            {
                payload: { accountKey, timeframeHours },
            }: PayloadAction<{ accountKey: AccountKey; timeframeHours: TimeframeHoursValue }>,
        ) => {
            state.accountToGraphTimeframeMap = {
                ...state.accountToGraphTimeframeMap,
                [accountKey]: timeframeHours,
            };
        },
    },
    extraReducers: builder => {
        builder.addCase(deviceActions.forgetDevice, (state, action) => {
            const deviceState = action.payload.device.state;
            if (deviceState) {
                state.accountToGraphTimeframeMap = filterObjectKeys(
                    state.accountToGraphTimeframeMap,
                    [deviceState],
                );
            }
        });
    },
});

export const selectPortfolioGraphTimeframe = (state: GraphSliceRootState) =>
    state.graph.portfolioGraphTimeframe;
export const selectAccountGraphTimeframe = (state: GraphSliceRootState, accountKey: AccountKey) => {
    const { accountToGraphTimeframeMap } = state.graph;

    const storedAccountGraphTimeframe = accountToGraphTimeframeMap[accountKey];

    return G.isUndefined(storedAccountGraphTimeframe)
        ? DEFAULT_GRAPH_TIMEFRAME_HOURS
        : storedAccountGraphTimeframe;
};

export const { setPortfolioGraphTimeframe, setAccountGraphTimeframe } = graphSlice.actions;
export const graphReducer = graphSlice.reducer;
