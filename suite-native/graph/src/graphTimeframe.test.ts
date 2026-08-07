import { getPortfolioGraphInstanceId } from './graphInstances';
import { graphPersistTransform } from './graphPersistTransform';
import { selectGraphTimeframe } from './graphSelectors';
import { DEFAULT_GRAPH_TIMEFRAME_HOURS, type GraphSliceRootState } from './slice';

const instanceId = getPortfolioGraphInstanceId();

const buildState = (timeframeHours: number | null): GraphSliceRootState => ({
    graph: { graphs: { [instanceId]: { timeframeHours } } },
});

describe('graph "All" timeframe (null)', () => {
    describe('selectGraphTimeframe', () => {
        it('preserves null as the "All" timeframe', () => {
            expect(selectGraphTimeframe(buildState(null), instanceId)).toBeNull();
        });

        it('returns the stored numeric timeframe unchanged', () => {
            expect(selectGraphTimeframe(buildState(168), instanceId)).toBe(168);
        });

        it('falls back to the default only when no timeframe is stored', () => {
            const emptyState: GraphSliceRootState = { graph: { graphs: {} } };

            expect(selectGraphTimeframe(emptyState, instanceId)).toBe(
                DEFAULT_GRAPH_TIMEFRAME_HOURS,
            );
        });
    });

    describe('graphPersistTransform rehydration', () => {
        it('rehydrates a persisted null timeframe as "All"', () => {
            const rehydrated = graphPersistTransform.out(
                { graphs: { [instanceId]: { timeframeHours: null } } },
                'graph',
                {},
            );

            expect(rehydrated.graphs[instanceId]?.timeframeHours).toBeNull();
        });

        it('falls back to the default when a persisted timeframe is missing', () => {
            const rehydrated = graphPersistTransform.out(
                { graphs: { [instanceId]: {} as { timeframeHours: number | null } } },
                'graph',
                {},
            );

            expect(rehydrated.graphs[instanceId]?.timeframeHours).toBe(
                DEFAULT_GRAPH_TIMEFRAME_HOURS,
            );
        });
    });
});
