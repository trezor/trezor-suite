import { createReducer } from '@reduxjs/toolkit';

import { GraphDataSource, LineGraphPoint } from './types';
import { getAllAccountsGraphPointsThunk, getSingleAccountGraphPointsThunk } from './graphThunks';
import { getValidGraphPoints } from './graphUtils';
import { accountNotFoundError, networkAccountsNotFoundError } from './constants';

export interface GraphState {
    dashboard: {
        points: LineGraphPoint[];
        error?: string | null;
    };
    account: {
        points: LineGraphPoint[];
        error?: string | null;
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
        })
        .addCase(getAllAccountsGraphPointsThunk.rejected, (state, action) => {
            if (action.error.message === networkAccountsNotFoundError) {
                state.dashboard.error = action.error.message;
            }
        })
        .addCase(getSingleAccountGraphPointsThunk.fulfilled, (state, action) => {
            if (action.payload) {
                updateGraphPoints(state, {
                    graphDataSource: 'account',
                    graphPoints: action.payload,
                });
            }
        })
        .addCase(getSingleAccountGraphPointsThunk.rejected, (state, action) => {
            if (action.error.message === accountNotFoundError) {
                state.dashboard.error = action.error.message;
            }
        });
});

export const selectDashboardGraph = (state: GraphRootState) => state.wallet.graph.dashboard;

export const selectAccountGraph = (state: GraphRootState) => state.wallet.graph.account;
