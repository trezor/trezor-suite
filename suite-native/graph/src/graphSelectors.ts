import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import {
    type GraphInstanceId,
    getAccountGraphInstanceId,
    getPortfolioGraphInstanceId,
} from './graphInstances';
import { type GraphSliceRootState, getGraphTimeframeOrDefault } from './slice';
import { type TimeframeHoursValue } from './types';

export const selectGraphTimeframe = (
    state: GraphSliceRootState,
    instanceId: GraphInstanceId,
): TimeframeHoursValue =>
    getGraphTimeframeOrDefault(state.graph.graphs[instanceId]?.timeframeHours);

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
): boolean => state.graph.graphs[instanceId]?.isLoading ?? true;

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
): string | null => state.graph.graphs[instanceId]?.error ?? null;

export const selectPortfolioGraphError = (state: GraphSliceRootState): string | null =>
    selectGraphError(state, getPortfolioGraphInstanceId());

export const selectAccountGraphError = (
    state: GraphSliceRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): string | null =>
    selectGraphError(state, getAccountGraphInstanceId({ accountKey, tokenContract }));
