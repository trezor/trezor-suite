import { G } from '@mobily/ts-belt';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AccountKey } from '@suite-common/wallet-types';

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

export const graphPersistWhitelist: Array<keyof GraphState> = [
    'portfolioGraphTimeframe',
    'accountToGraphTimeframeMap',
];

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
