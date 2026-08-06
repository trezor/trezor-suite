import { createTransform } from 'redux-persist';

import { type AccountKey } from '@suite-common/wallet-types';
import { filterKeysByPartialMatch, selectDeviceStatesNotRemembered } from '@suite-native/storage';

import {
    type GraphInstanceId,
    type GraphInstanceStateKey,
    getAccountGraphInstanceId,
    getGraphInstanceIdFromStateKey,
    getGraphInstanceStateKey,
    getPortfolioGraphInstanceId,
    isGraphInstanceId,
} from './graphInstances';
import { type GraphInstanceState, type GraphState, getGraphTimeframeOrDefault } from './slice';
import { type TimeframeHoursValue } from './types';

type Graphs = GraphState['graphs'];
type PersistedGraphInstanceState = Pick<GraphInstanceState, 'timeframeHours'>;
type PersistedGraphs = Partial<Record<GraphInstanceId, PersistedGraphInstanceState>>;
type PersistedGraphState = Partial<{
    graphs: PersistedGraphs;
    portfolioGraphTimeframe: TimeframeHoursValue;
    accountToGraphTimeframeMap: Record<AccountKey, TimeframeHoursValue>;
}>;

const persistGraphs = (graphs: Graphs): PersistedGraphs =>
    Object.fromEntries(
        Object.entries(graphs).flatMap(([stateKey, graph]) => {
            if (!graph) return [];

            const instanceId = getGraphInstanceIdFromStateKey(stateKey as GraphInstanceStateKey);

            return [[instanceId, { timeframeHours: graph.timeframeHours }]];
        }),
    );

const rehydrateGraphState = (persistedState: PersistedGraphState | undefined): GraphState => {
    const graphs: Graphs = {};

    Object.entries(persistedState?.graphs ?? {}).forEach(([instanceId, persistedGraph]) => {
        if (persistedGraph && isGraphInstanceId(instanceId)) {
            graphs[getGraphInstanceStateKey(instanceId)] = {
                timeframeHours: getGraphTimeframeOrDefault(persistedGraph.timeframeHours),
            };
        }
    });

    if (persistedState?.portfolioGraphTimeframe !== undefined) {
        graphs[getGraphInstanceStateKey(getPortfolioGraphInstanceId())] = {
            timeframeHours: persistedState.portfolioGraphTimeframe,
        };
    }

    Object.entries(persistedState?.accountToGraphTimeframeMap ?? {}).forEach(
        ([accountKey, timeframeHours]) => {
            const instanceId = getAccountGraphInstanceId({ accountKey: accountKey as AccountKey });
            graphs[getGraphInstanceStateKey(instanceId)] = { timeframeHours };
        },
    );

    return { graphs };
};

export const graphPersistTransform = createTransform<GraphState, PersistedGraphState>(
    (inboundState, _, state) => ({
        graphs: filterKeysByPartialMatch(
            persistGraphs(inboundState.graphs),
            selectDeviceStatesNotRemembered(state),
        ),
    }),
    rehydrateGraphState,
    { whitelist: ['graph'] },
);
