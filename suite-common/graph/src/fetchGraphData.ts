import { type useDispatch } from 'react-redux';

import { A } from '@mobily/ts-belt';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { getAccountMovementEvents } from './graphBalanceEvents';
import { getMultipleAccountBalanceHistoryWithFiat } from './graphDataFetching';
import type {
    AccountItem,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
    GroupedBalanceMovementEvent,
} from './types';

/** The value is equal to 2% of the graph time length (x-axis). It is a minimal offset from the edge of the graph,
 * to make the whole event visible even on very small devices such as iPhone SE 1st gen. */
const EVENT_MINIMAL_PROPORTIONAL_EDGE_OFFSET = 0.02;

/** Ensures that the edge events are not too close to the interval extremes so they would not be fully visible. */
const normalizeExtremeGraphEvents = (
    events: GroupedBalanceMovementEvent[],
    startOfTimeFrameDate: Date,
    endOfTimeFrameDate: Date,
) => {
    if (A.isEmpty(events)) return;

    const timeframeUnixLength = endOfTimeFrameDate.getTime() - startOfTimeFrameDate.getTime();
    const minimalEdgeOffset = timeframeUnixLength * EVENT_MINIMAL_PROPORTIONAL_EDGE_OFFSET;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const minimalEventDate = startOfTimeFrameDate.getTime() + minimalEdgeOffset;
    const maximalEventDate = endOfTimeFrameDate.getTime() - minimalEdgeOffset;

    if (firstEvent && firstEvent.date.getTime() < minimalEventDate) {
        firstEvent.date = new Date(minimalEventDate);
    }

    if (lastEvent && lastEvent.date.getTime() > maximalEventDate) {
        lastEvent.date = new Date(maximalEventDate);
    }
};

export type FetchGraphDataParams = {
    accounts: AccountItem[];
    baseCurrencyCode: BaseCurrencyCode;
    endOfTimeFrameDate: Date;
    // if start date is null we are fetching all data till first account movement
    startOfTimeFrameDate: Date | null;
    // Transaction events are supported only for a single account. Pass the account to fetch them for.
    eventsAccount?: AccountItem;
    isElectrumBackend: boolean;
    forceRefetch?: boolean;
    dispatch: ReturnType<typeof useDispatch>;
};

export type GraphData = {
    points: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[];
    events?: GroupedBalanceMovementEvent[];
};

export const fetchGraphData = async ({
    accounts,
    baseCurrencyCode,
    endOfTimeFrameDate,
    startOfTimeFrameDate,
    eventsAccount,
    isElectrumBackend,
    forceRefetch,
    dispatch,
}: FetchGraphDataParams): Promise<GraphData> => {
    const points = await getMultipleAccountBalanceHistoryWithFiat({
        accounts,
        baseCurrencyCode,
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        forceRefetch,
        isElectrumBackend,
        dispatch,
    });

    if (!eventsAccount) {
        return { points };
    }

    const events = await getAccountMovementEvents({
        account: eventsAccount,
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        dispatch,
    });

    normalizeExtremeGraphEvents(
        events,
        startOfTimeFrameDate ?? points[0]?.date ?? new Date(),
        endOfTimeFrameDate,
    );

    return { points, events };
};
