import { A } from '@mobily/ts-belt';
import { getDefaultStore } from 'jotai';

import {
    type AccountItem,
    type FetchGraphDataParams,
    type FiatGraphPoint,
    type FiatGraphPointWithCryptoBalance,
    fetchGraphData,
    getTimeFrameForHistoryHours,
} from '@suite-common/graph';
import { type Dispatch } from '@suite-common/redux-utils';
import { createThunk } from '@suite-common/redux-utils';
import { type FetchTransactionsFromNowUntilTimestampThunkState } from '@suite-common/wallet-core';

import { accountDetailGraphAtoms } from './accountDetailGraphAtoms';
import { type GraphInstanceId, isPortfolioGraphInstanceId } from './graphInstances';
import {
    type RefetchGraphThunkParams,
    type RefetchGraphThunkResult,
    RefetchGraphThunkStatus,
} from './graphThunkTypes';
import { portfolioGraphAtoms } from './portfolioGraphAtoms';
import { type TimeframeHoursValue } from './types';
import { checkAndReportGraphError, omitErrorMessageSensitiveData } from './utils';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';
const GRAPH_NOT_AVAILABLE_ERROR_MESSAGE = 'Graph is not available for testnet coins.';

// The app doesn't mount any jotai Provider, so all atoms live in the default store
// and it is safe to write them from outside of React. Do not add a jotai Provider.
const jotaiStore = getDefaultStore();

// Timestamp of the last started fetch per atom bundle, so a finished fetch can detect
// that it was interrupted by a newer one and its result should be thrown away.
const lastFetchTimestamps = new WeakMap<object, number>();

type FetchGraphDataToAtomsParams = {
    instanceId: GraphInstanceId;
    accounts: AccountItem[];
    eventsAccount?: AccountItem;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
    dispatch: Dispatch;
};

const getGraphAtomsForInstanceId = (instanceId: GraphInstanceId) => {
    if (isPortfolioGraphInstanceId(instanceId)) {
        return portfolioGraphAtoms;
    }

    return accountDetailGraphAtoms;
};

const setGraphPointsForInstanceId = (
    instanceId: GraphInstanceId,
    points: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[],
) => {
    // FIXME: Remove this atom-specific branch once graph points/events are stored in Redux graph instances.
    if (isPortfolioGraphInstanceId(instanceId)) {
        jotaiStore.set(portfolioGraphAtoms.graphPointsAtom, points as FiatGraphPoint[]);

        return;
    }

    jotaiStore.set(
        accountDetailGraphAtoms.graphPointsAtom,
        points as FiatGraphPointWithCryptoBalance[],
    );
};

const getGraphError = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    return new Error(String(error));
};

const fetchGraphDataToAtoms = async ({
    instanceId,
    accounts,
    eventsAccount,
    timeframeHours,
    isElectrumBackend,
    baseCurrencyCode,
    forceRefetch,
    dispatch,
}: FetchGraphDataToAtomsParams): Promise<RefetchGraphThunkResult> => {
    const atoms = getGraphAtomsForInstanceId(instanceId);
    const fetchTimestamp = Date.now();
    lastFetchTimestamps.set(atoms, fetchTimestamp);

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

    if (lastFetchTimestamps.get(atoms) !== fetchTimestamp) {
        return { status: RefetchGraphThunkStatus.Interrupted };
    }

    // The point type is determined by the accounts of the graph the bundle belongs to.
    setGraphPointsForInstanceId(instanceId, points);

    return { status: RefetchGraphThunkStatus.Fetched };
};

type RefetchGraphThunkState = FetchTransactionsFromNowUntilTimestampThunkState;

export const refetchGraphThunk = createThunk<
    RefetchGraphThunkResult,
    RefetchGraphThunkParams,
    { rejectValue: string; state: RefetchGraphThunkState }
>(`${GRAPH_MODULE_PREFIX}/refetchGraph`, async (params, { dispatch, rejectWithValue }) => {
    const {
        instanceId,
        accounts,
        eventsAccount,
        isDiscoveryRunning,
        timeframeHours,
        isElectrumBackend,
        baseCurrencyCode,
        forceRefetch,
    } = params;

    // The account list is not final while discovery is running, so the graph just
    // keeps loading and waits for it to finish before starting to fetch values.
    if (isDiscoveryRunning) {
        return { status: RefetchGraphThunkStatus.WaitingForDiscovery };
    }

    if (A.isEmpty(accounts)) {
        return rejectWithValue(GRAPH_NOT_AVAILABLE_ERROR_MESSAGE);
    }

    try {
        return await fetchGraphDataToAtoms({
            instanceId,
            accounts,
            eventsAccount,
            timeframeHours,
            isElectrumBackend,
            baseCurrencyCode,
            forceRefetch,
            dispatch,
        });
    } catch (error) {
        const graphError = getGraphError(error);

        // Preserve the stack trace in the local console, but sanitize it first. suite-native
        // enables Sentry's captureConsoleIntegration, which ships console.error args verbatim
        // to Sentry (redactSentryEvent does not scrub exception/message bodies), and the raw
        // error can embed the account descriptor + device static session id — the accountKey in
        // `Account not found: <descriptor>-<symbol>-<staticSessionId>`. A raw console.error(error)
        // would leak them, unlike the two sinks below which already scrub via
        // omitErrorMessageSensitiveData.
        const sanitizedError = new Error(omitErrorMessageSensitiveData(graphError.message));
        sanitizedError.name = graphError.name;
        sanitizedError.stack = omitErrorMessageSensitiveData(graphError.stack ?? '');
        console.error(sanitizedError);

        checkAndReportGraphError(graphError);

        return rejectWithValue(omitErrorMessageSensitiveData(graphError.message));
    }
});
