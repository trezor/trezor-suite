import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { LineGraphPoint } from '@suite-common/wallet-types';

import { graphActions } from './graphActions';

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
        section: 'dashboard' | 'account';
        points: LineGraphPoint[];
    },
) => {
    const { section, points } = payload;
    state[section].points = points;
};

export const prepareGraphReducer = createReducerWithExtraDeps(graphInitialState, builder => {
    builder.addCase(graphActions.updateGraphPoints, (state, action) => {
        updateSectionPoints(state, action.payload);
    });
});

export const selectDashboardGraphPoints = (state: GraphRootState) =>
    state.wallet.graph.dashboard.points;
