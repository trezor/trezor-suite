import { createReducer } from '@reduxjs/toolkit';

import { GraphDataSource, LineGraphPoint } from './types';
import { getAllAccountsGraphPointsThunk, getSingleAccountGraphPointsThunk } from './graphThunks';
import { getValidGraphPoints } from './graphUtils';

export interface GraphState {
    dashboard: {
        points: LineGraphPoint[];
        error?: string | null;
        loading?: boolean;
    };
    account: {
        points: LineGraphPoint[];
        error?: string | null;
        loading?: boolean;
    };
}

export const graphInitialState: GraphState = {
    dashboard: {
        points: [],
    },
    account: {
        points: [],
    },
};

export type GraphRootState = {
    wallet: {
        graph: GraphState;
    };
};

const updateGraphPoints = (
    state: GraphState,
    payload: {
        graphDataSource: GraphDataSource;
        graphPoints: LineGraphPoint[];
    },
) => {
    const { graphDataSource, graphPoints } = payload;
    state[graphDataSource].error = null;
    state[graphDataSource].points = getValidGraphPoints(graphPoints);
};

export const graphReducer = createReducer(graphInitialState, builder => {
    builder
        .addCase(getAllAccountsGraphPointsThunk.fulfilled, (state, action) => {
            updateGraphPoints(state, {
                graphDataSource: 'dashboard',
                graphPoints: action.payload,
            });
            state.dashboard.loading = false;
        })
        .addCase(getAllAccountsGraphPointsThunk.rejected, (state, action) => {
            state.dashboard.error = action.error.message;
            state.dashboard.loading = false;
        })
        .addCase(getAllAccountsGraphPointsThunk.pending, state => {
            state.dashboard.loading = true;
        })
        .addCase(getSingleAccountGraphPointsThunk.fulfilled, (state, action) => {
            updateGraphPoints(state, {
                graphDataSource: 'account',
                graphPoints: action.payload,
            });
            state.account.loading = false;
        })
        .addCase(getSingleAccountGraphPointsThunk.rejected, (state, action) => {
            state.account.error = action.error.message;
            state.account.loading = false;
        })
        .addCase(getSingleAccountGraphPointsThunk.pending, state => {
            state.account.loading = true;
        });
});

export const selectDashboardGraph = (state: GraphRootState) => state.wallet.graph.dashboard;

export const selectAccountGraph = (state: GraphRootState) => state.wallet.graph.account;
