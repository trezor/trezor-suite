import { createReducer } from '@reduxjs/toolkit';

import { GraphPlacement, LineGraphPoint } from './types';
import { getAllAccountsGraphPointsThunk, getSingleAccountGraphPointsThunk } from './graphThunks';

export interface GraphState {
    dashboard: {
        points: LineGraphPoint[];
    };
    account: {
        points: LineGraphPoint[];
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
        graphPlacement: GraphPlacement;
        graphPoints: LineGraphPoint[];
    },
) => {
    const { graphPlacement, graphPoints } = payload;
    /**
     * react-native-graph library has problems with rendering path when there are some invalid values.
     * Also animated=true graph does not show when dates do not follow each other from the unix epoch
     * (start on 00:00:00 UTC on 1 January 1970).
     *
     */
    const validGraphPoints = graphPoints
        .filter(point => !Number.isNaN(point.value))
        .map((point, index) => ({
            ...point,
            date: new Date(index),
        }));
    state[graphPlacement].points = validGraphPoints;
};

export const graphReducer = createReducer(graphInitialState, builder => {
    builder
        .addCase(getAllAccountsGraphPointsThunk.fulfilled, (state, action) => {
            if (action.payload) {
                updateGraphPoints(state, action.payload);
            }
        })
        .addCase(getSingleAccountGraphPointsThunk.fulfilled, (state, action) => {
            if (action.payload) {
                updateGraphPoints(state, {
                    graphPlacement: 'account',
                    graphPoints: action.payload,
                });
            }
        });
});

export const selectDashboardGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.dashboard.points;

export const selectAccountGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.account.points;
