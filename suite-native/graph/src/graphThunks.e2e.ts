/**
 * Disables graph data fetching for E2E tests to mitigate flakiness.
 */
import { createThunk } from '@suite-common/redux-utils';

import { type RefetchGraphThunkParams, type RefetchGraphThunkResult } from './graphThunkTypes';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';
const GRAPH_DISABLED_ERROR_MESSAGE = 'Graph is disabled for E2E tests for performance reasons.';

export const refetchGraphThunk = createThunk<
    RefetchGraphThunkResult,
    RefetchGraphThunkParams,
    { rejectValue: string }
>(`${GRAPH_MODULE_PREFIX}/refetchGraph`, (_params, { rejectWithValue }) =>
    rejectWithValue(GRAPH_DISABLED_ERROR_MESSAGE),
);
