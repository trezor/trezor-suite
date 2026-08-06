import {
    type FiatGraphPoint,
    type FiatGraphPointWithCryptoBalance,
    type GroupedBalanceMovementEvent,
} from '@suite-common/graph';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { deserializeGraphEvents, deserializeGraphPoints } from './graphDataUtils';
import {
    type GraphInstanceId,
    getAccountGraphInstanceId,
    getGraphInstanceStateKey,
    getPortfolioGraphInstanceId,
} from './graphInstances';
import { type GraphSliceRootState, getGraphTimeframeOrDefault } from './slice';
import {
    type StoredFiatGraphPoint,
    type StoredGroupedBalanceMovementEvent,
    type TimeframeHoursValue,
} from './types';

const createGraphMemoizedSelector = createWeakMapSelector.withTypes<GraphSliceRootState>();

const selectStoredGraphPoints = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): StoredFiatGraphPoint[] | undefined =>
    state.graph.graphs[getGraphInstanceStateKey(instanceId)]?.points;

const selectStoredGraphEvents = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): StoredGroupedBalanceMovementEvent[] | undefined =>
    state.graph.graphs[getGraphInstanceStateKey(instanceId)]?.events;

export const selectGraphTimeframe = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): TimeframeHoursValue =>
    getGraphTimeframeOrDefault(
        state.graph.graphs[getGraphInstanceStateKey(instanceId)]?.timeframeHours,
    );

export const selectPortfolioGraphTimeframe = (state: GraphSliceRootState): TimeframeHoursValue =>
    selectGraphTimeframe(state, getPortfolioGraphInstanceId());

export const selectAccountGraphTimeframe = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): TimeframeHoursValue =>
    selectGraphTimeframe(state, getAccountGraphInstanceId({ accountKey, tokenContract }));

export const selectGraphIsLoading = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): boolean => state.graph.graphs[getGraphInstanceStateKey(instanceId)]?.isLoading ?? true;

export const selectPortfolioGraphIsLoading = (state: GraphSliceRootState): boolean =>
    selectGraphIsLoading(state, getPortfolioGraphInstanceId());

export const selectAccountGraphIsLoading = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => selectGraphIsLoading(state, getAccountGraphInstanceId({ accountKey, tokenContract }));

export const selectGraphError = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): string | null => state.graph.graphs[getGraphInstanceStateKey(instanceId)]?.error ?? null;

export const selectPortfolioGraphError = (state: GraphSliceRootState): string | null =>
    selectGraphError(state, getPortfolioGraphInstanceId());

export const selectAccountGraphError = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): string | null =>
    selectGraphError(state, getAccountGraphInstanceId({ accountKey, tokenContract }));

export const selectGraphPoints = createGraphMemoizedSelector(
    [selectStoredGraphPoints],
    (points: StoredFiatGraphPoint[] | undefined): FiatGraphPoint[] =>
        deserializeGraphPoints(points),
);

export const selectPortfolioGraphPoints = (state: GraphSliceRootState): FiatGraphPoint[] =>
    selectGraphPoints(state, getPortfolioGraphInstanceId());

export const selectAccountGraphPoints = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): FiatGraphPointWithCryptoBalance[] =>
    selectGraphPoints(
        state,
        getAccountGraphInstanceId({ accountKey, tokenContract }),
    ) as FiatGraphPointWithCryptoBalance[];

export const selectGraphEvents = createGraphMemoizedSelector(
    [selectStoredGraphEvents],
    (events: StoredGroupedBalanceMovementEvent[] | undefined): GroupedBalanceMovementEvent[] =>
        deserializeGraphEvents(events),
);

export const selectAccountGraphEvents = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): GroupedBalanceMovementEvent[] =>
    selectGraphEvents(state, getAccountGraphInstanceId({ accountKey, tokenContract }));
