import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { roundToNearestMinutes, subHours } from 'date-fns';
import { A } from '@mobily/ts-belt';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

import { getMultipleAccountBalanceHistoryWithFiat } from './graphDataFetching';
import {
    AccountItem,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
    GroupedBalanceMovementEvent,
} from './types';
import { getAccountMovementEvents } from './graphBalanceEvents';

export type CommonUseGraphParams = {
    fiatCurrency: FiatCurrencyCode;
};

type useGraphForAccountsParams<TIsPortfolioGraph extends boolean = boolean> =
    CommonUseGraphParams & {
        accounts: AccountItem[];
        endOfTimeFrameDate: Date;
        startOfTimeFrameDate: StartOfTimeFrameDate;
        isPortfolioGraph: TIsPortfolioGraph;
    };

type CommonUseGraphReturnType = {
    graphEvents?: GroupedBalanceMovementEvent[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
};

// if start date is null we are fetching all data till first account movement
type StartOfTimeFrameDate = Date | null;

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

    if (firstEvent.date.getTime() < minimalEventDate) {
        firstEvent.date = new Date(minimalEventDate);
    }

    if (lastEvent.date.getTime() > maximalEventDate) {
        lastEvent.date = new Date(maximalEventDate);
    }
};

export function useGraphForAccounts(params: useGraphForAccountsParams<false>): {
    graphPoints: FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(params: useGraphForAccountsParams<true>): {
    graphPoints: FiatGraphPoint[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(params: useGraphForAccountsParams): {
    graphPoints: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType {
    const { accounts, fiatCurrency, endOfTimeFrameDate, startOfTimeFrameDate, isPortfolioGraph } =
        params;
    const [graphPoints, setGraphPoints] = useState<
        FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[]
    >([]);
    const [graphEvents, setGraphEvents] = useState<GroupedBalanceMovementEvent[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchToken, setRefetchToken] = useState(0);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const refetch = useCallback(() => {
        // this is used to trigger to force re-run of useEffect lower
        setRefetchToken(previousRefetchToken => previousRefetchToken + 1);
    }, []);

    useEffect(() => {
        let shouldSetValues = true;

        if (isPortfolioGraph && isDiscoveryActive) {
            // The graph waits until the discovery is finished, before starting to fetch values.
            setIsLoading(true);
            setError(null);
        } else if (A.isEmpty(accounts)) {
            setIsLoading(false);
            setError('Graph is not available for testnet coins.');
        } else {
            const getGraphValues = async () => {
                setIsLoading(true);
                try {
                    const points = await getMultipleAccountBalanceHistoryWithFiat({
                        accounts,
                        fiatCurrency,
                        startOfTimeFrameDate,
                        endOfTimeFrameDate,
                    });

                    let events;

                    // Process transaction events only for the single account detail graph.
                    if (!isPortfolioGraph) {
                        events = await getAccountMovementEvents({
                            account: accounts[0],
                            startOfTimeFrameDate,
                            endOfTimeFrameDate,
                        });

                        normalizeExtremeGraphEvents(
                            events,
                            startOfTimeFrameDate ?? points[0].date,
                            endOfTimeFrameDate,
                        );
                    }

                    if (shouldSetValues) {
                        setGraphPoints(points);
                        setGraphEvents(events);
                        setError(null);
                    }
                } catch (err) {
                    setError(err?.message);
                }

                setIsLoading(false);
            };

            getGraphValues();
        }

        return () => {
            shouldSetValues = false;
        };
    }, [
        accounts,
        fiatCurrency,
        refetchToken,
        endOfTimeFrameDate,
        startOfTimeFrameDate,
        isPortfolioGraph,
        isDiscoveryActive,
    ]);

    return { graphPoints, graphEvents, isLoading, error, refetch };
}

export const useGetTimeFrameForHistoryHours = (timeframeHours: number | null) =>
    useMemo(() => {
        const endOfTimeFrameDate = roundToNearestMinutes(new Date(), {
            nearestTo: 10,
            roundingMethod: 'floor',
        });
        const startOfTimeFrameDate = timeframeHours
            ? subHours(endOfTimeFrameDate, timeframeHours)
            : null;

        return { endOfTimeFrameDate, startOfTimeFrameDate };
    }, [timeframeHours]);
