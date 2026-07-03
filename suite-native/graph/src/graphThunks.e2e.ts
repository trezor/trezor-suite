/**
 * Disables graph data fetching for E2E tests to mitigate flakiness.
 */
import { getDefaultStore } from 'jotai';

import { createThunk } from '@suite-common/redux-utils';

import { portfolioGraphAtoms } from './portfolioGraphAtoms';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';

const jotaiStore = getDefaultStore();

export const refetchPortfolioGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchPortfolioGraph`,
    (_params: { forceRefetch?: boolean }) => {
        jotaiStore.set(portfolioGraphAtoms.isLoadingAtom, false);
        jotaiStore.set(
            portfolioGraphAtoms.errorAtom,
            new Error('Graph is disabled for E2E tests for performance reasons.'),
        );
    },
);
