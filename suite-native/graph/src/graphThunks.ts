import { type useDispatch } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    type AccountItem,
    type FetchGraphDataParams,
    fetchGraphData,
    getTimeFrameForHistoryHours,
} from '@suite-common/graph';
import { createThunk } from '@suite-common/redux-utils';

import { serializeGraphEvents, serializeGraphPoints } from './graphDataUtils';
import { type GraphInstanceId } from './graphInstances';
import {
    type RefetchGraphThunkParams,
    type RefetchGraphThunkResult,
    RefetchGraphThunkStatus,
} from './graphThunkTypes';
import { type TimeframeHoursValue } from './types';
import { checkAndReportGraphError, omitErrorMessageSensitiveData } from './utils';

const GRAPH_MODULE_PREFIX = '@suite-native/graph';
const GRAPH_NOT_AVAILABLE_ERROR_MESSAGE = 'Graph is not available for testnet coins.';

// Timestamp of the last started fetch per graph instance, so a finished fetch can detect
// that it was interrupted by a newer one and its result should be thrown away.
const lastFetchTimestamps = new Map<GraphInstanceId, number>();

type FetchGraphDataForReduxParams = {
    instanceId: GraphInstanceId;
    accounts: AccountItem[];
    eventsAccount?: AccountItem;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
    dispatch: ReturnType<typeof useDispatch>;
};

const getGraphError = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    return new Error(String(error));
};

const fetchGraphDataForRedux = async ({
    instanceId,
    accounts,
    eventsAccount,
    timeframeHours,
    isElectrumBackend,
    baseCurrencyCode,
    forceRefetch,
    dispatch,
}: FetchGraphDataForReduxParams): Promise<RefetchGraphThunkResult> => {
    const fetchTimestamp = Date.now();
    lastFetchTimestamps.set(instanceId, fetchTimestamp);

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

    if (lastFetchTimestamps.get(instanceId) !== fetchTimestamp) {
        return { status: RefetchGraphThunkStatus.Interrupted };
    }

    return {
        status: RefetchGraphThunkStatus.Fetched,
        points: serializeGraphPoints(points),
        events: serializeGraphEvents(events),
    };
};

export const refetchGraphThunk = createThunk<
    RefetchGraphThunkResult,
    RefetchGraphThunkParams,
    { rejectValue: string }
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
        return await fetchGraphDataForRedux({
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
        // Preserve the stack trace in the local console while storing only a sanitized message.
        console.error(error);

        const graphError = getGraphError(error);
        checkAndReportGraphError(graphError);

        return rejectWithValue(omitErrorMessageSensitiveData(graphError.message));
    }
});
