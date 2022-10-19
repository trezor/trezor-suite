import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { GraphSection, LineGraphPoint } from './types';
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

const updateSectionPoints = (
    state: GraphState,
    payload: {
        section: GraphSection;
        graphPoints: LineGraphPoint[];
    },
) => {
    const { section, graphPoints } = payload;
    /**
     * react-native-graph library has problems with rendering path when there are some invalid values.
     * Also graph is not showing (with props animated=true) when dates do not follow each other by milliseconds.
     */
    const validGraphPoints = graphPoints
        .filter(point => !Number.isNaN(point.value))
        .map((point, index) => ({
            ...point,
            date: new Date(index),
        }));
    state[section].points = validGraphPoints;
};

export const prepareGraphReducer = createReducerWithExtraDeps(graphInitialState, builder => {
    builder
        .addCase(getAllAccountsGraphPointsThunk.fulfilled, (state, action) => {
            if (action.payload) {
                updateSectionPoints(state, action.payload);
            }
        })
        .addCase(getSingleAccountGraphPointsThunk.fulfilled, (state, action) => {
            if (action.payload) {
                updateSectionPoints(state, {
                    section: 'account',
                    graphPoints: action.payload,
                });
            }
        });
});

export const selectDashboardGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.dashboard.points;

export const selectAccountGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.account.points;
