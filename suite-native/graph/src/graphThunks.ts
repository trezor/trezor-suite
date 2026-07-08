import { type useDispatch } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { getDefaultStore } from 'jotai';

import {
    type AccountItem,
    type FetchGraphDataParams,
    type FiatGraphPoint,
    fetchGraphData,
    getTimeFrameForHistoryHours,
} from '@suite-common/graph';
import { createThunk } from '@suite-common/redux-utils';

import { accountDetailGraphAtoms } from './accountDetailGraphAtoms';
import { type GraphAtoms } from './createGraphAtoms';
import { portfolioGraphAtoms } from './portfolioGraphAtoms';
import { type TimeframeHoursValue } from './types';
import { checkAndReportGraphError } from './utils';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';

// The app doesn't mount any jotai Provider, so all atoms live in the default store
// and it is safe to write them from outside of React. Do not add a jotai Provider.
const jotaiStore = getDefaultStore();

// Timestamp of the last started fetch per atom bundle, so a finished fetch can detect
// that it was interrupted by a newer one and its result should be thrown away.
const lastFetchTimestamps = new WeakMap<object, number>();

type FetchGraphDataToAtomsParams<TGraphPoint extends FiatGraphPoint> = {
    atoms: GraphAtoms<TGraphPoint>;
    accounts: AccountItem[];
    eventsAccount?: AccountItem;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
    dispatch: ReturnType<typeof useDispatch>;
};

const fetchGraphDataToAtoms = async <TGraphPoint extends FiatGraphPoint>({
    atoms,
    accounts,
    eventsAccount,
    timeframeHours,
    isElectrumBackend,
    baseCurrencyCode,
    forceRefetch,
    dispatch,
}: FetchGraphDataToAtomsParams<TGraphPoint>) => {
    const fetchTimestamp = Date.now();
    lastFetchTimestamps.set(atoms, fetchTimestamp);

    jotaiStore.set(atoms.isLoadingAtom, true);

    try {
        const { startOfTimeFrameDate, endOfTimeFrameDate } =
            getTimeFrameForHistoryHours(timeframeHours);

        const { points, events } = await fetchGraphData({
            accounts,
            baseCurrencyCode,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
            eventsAccount,
            isElectrumBackend,
            forceRefetch,
            dispatch,
        });

        if (events) {
            // We need to set events after graph points, othewise it will mess up events randomly
            // because of strange useEffect in AnimatedLineGraph component.
            jotaiStore.set(atoms.graphEventsAtom, events);
        }

        // If the fetch was interrupted by a newer fetch, do not set the values.
        if (lastFetchTimestamps.get(atoms) !== fetchTimestamp) return;

        jotaiStore.set(atoms.errorAtom, null);
        // The point type is determined by the accounts of the graph the bundle belongs to.
        jotaiStore.set(atoms.graphPointsAtom, points as TGraphPoint[]);
    } catch (error) {
        // Rethrow error because we get stack trace in console.
        console.error(error);

        // If the fetch was interrupted by a newer fetch, do not set the error.
        if (lastFetchTimestamps.get(atoms) !== fetchTimestamp) return;

        checkAndReportGraphError(error as Error);
        jotaiStore.set(atoms.errorAtom, error as Error);
    }

    jotaiStore.set(atoms.isLoadingAtom, false);
};

export const refetchPortfolioGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchPortfolioGraph`,
    async (
        {
            accounts,
            isDiscoveryRunning,
            timeframeHours,
            isElectrumBackend,
            baseCurrencyCode,
            forceRefetch,
        }: RefetchPortfolioGraphThunkParams,
        { dispatch },
    ) => {
        // The account list is not final while discovery is running, so the graph just
        // keeps loading and waits for it to finish before starting to fetch values.
        if (isDiscoveryRunning) {
            jotaiStore.set(portfolioGraphAtoms.isLoadingAtom, true);
            jotaiStore.set(portfolioGraphAtoms.errorAtom, null);

            return;
        }

        if (A.isEmpty(accounts)) {
            jotaiStore.set(portfolioGraphAtoms.isLoadingAtom, false);
            jotaiStore.set(
                portfolioGraphAtoms.errorAtom,
                new Error('Graph is not available for testnet coins.'),
            );

            return;
        }

        await fetchGraphDataToAtoms({
            atoms: portfolioGraphAtoms,
            accounts,
            timeframeHours,
            isElectrumBackend,
            baseCurrencyCode,
            forceRefetch,
            dispatch,
        });
    },
);

export type RefetchPortfolioGraphThunkParams = {
    accounts: AccountItem[];
    isDiscoveryRunning: boolean;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
};

export type RefetchAccountGraphThunkParams = {
    accountItem?: AccountItem;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
};

export const refetchAccountGraphThunk = createThunk(
    `${GRAPH_MODULE_PREFIX}/refetchAccountGraph`,
    async (
        {
            accountItem,
            timeframeHours,
            isElectrumBackend,
            baseCurrencyCode,
            forceRefetch,
        }: RefetchAccountGraphThunkParams,
        { dispatch },
    ) => {
        if (!accountItem) {
            jotaiStore.set(accountDetailGraphAtoms.isLoadingAtom, false);
            jotaiStore.set(
                accountDetailGraphAtoms.errorAtom,
                new Error('Graph is not available for testnet coins.'),
            );

            return;
        }

        await fetchGraphDataToAtoms({
            atoms: accountDetailGraphAtoms,
            accounts: [accountItem],
            eventsAccount: accountItem,
            timeframeHours,
            isElectrumBackend,
            baseCurrencyCode,
            forceRefetch,
            dispatch,
        });
    },
);
