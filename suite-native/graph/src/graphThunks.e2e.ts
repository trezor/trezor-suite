/**
 * Disables graph data fetching for E2E tests to mitigate flakiness.
 */
import { getDefaultStore } from 'jotai';

import { createThunk } from '@suite-common/redux-utils';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { accountDetailGraphAtoms } from './accountDetailGraphAtoms';
import { type GraphAtoms } from './createGraphAtoms';
import { portfolioGraphAtoms } from './portfolioGraphAtoms';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';

const jotaiStore = getDefaultStore();

const disableGraph = ({
    isLoadingAtom,
    errorAtom,
}: Pick<GraphAtoms, 'isLoadingAtom' | 'errorAtom'>) => {
    jotaiStore.set(isLoadingAtom, false);
    jotaiStore.set(
        errorAtom,
        new Error('Graph is disabled for E2E tests for performance reasons.'),
    );
};

export const refetchPortfolioGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchPortfolioGraph`,
    (_params: { forceRefetch?: boolean }) => {
        disableGraph(portfolioGraphAtoms);
    },
);

export const refetchAccountGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchAccountGraph`,
    (_params: { accountKey: AccountKey; tokenContract?: TokenAddress; forceRefetch?: boolean }) => {
        disableGraph(accountDetailGraphAtoms);
    },
);
