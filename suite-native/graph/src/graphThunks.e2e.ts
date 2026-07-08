/**
 * Disables graph data fetching for E2E tests to mitigate flakiness.
 */
import { getDefaultStore } from 'jotai';

import { type AccountItem, type FetchGraphDataParams } from '@suite-common/graph';
import { createThunk } from '@suite-common/redux-utils';

import { accountDetailGraphAtoms } from './accountDetailGraphAtoms';
import { type GraphAtoms } from './createGraphAtoms';
import { portfolioGraphAtoms } from './portfolioGraphAtoms';
import { type TimeframeHoursValue } from './types';

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
    (_params: RefetchPortfolioGraphThunkParams) => {
        disableGraph(portfolioGraphAtoms);
    },
);

type RefetchPortfolioGraphThunkParams = {
    accounts: AccountItem[];
    isDiscoveryRunning: boolean;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
};

export const refetchAccountGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchAccountGraph`,
    (_params: RefetchAccountGraphThunkParams) => {
        disableGraph(accountDetailGraphAtoms);
    },
);

type RefetchAccountGraphThunkParams = {
    accountItem?: AccountItem;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
};
