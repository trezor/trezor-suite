import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { fetchGraphData } from './fetchGraphData';
import { getTimeFrameForHistoryHours } from './graphUtils';
import {
    type AccountItem,
    type FiatGraphPoint,
    type FiatGraphPointWithCryptoBalance,
    type GroupedBalanceMovementEvent,
} from './types';

export type CommonUseGraphParams = {
    baseCurrencyCode: BaseCurrencyCode;
};

type useGraphForAccountsParams<TIsPortfolioGraph extends boolean = boolean> =
    CommonUseGraphParams & {
        accounts: AccountItem[];
        endOfTimeFrameDate: Date;
        startOfTimeFrameDate: StartOfTimeFrameDate;
        isPortfolioGraph: TIsPortfolioGraph;
        isElectrumBackend: boolean;
    };

type CommonUseGraphReturnType = {
    graphEvents?: GroupedBalanceMovementEvent[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};

// if start date is null we are fetching all data till first account movement
type StartOfTimeFrameDate = Date | null;

export function useGraphForAccounts(params: useGraphForAccountsParams<false>): {
    graphPoints: FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(params: useGraphForAccountsParams<true>): {
    graphPoints: FiatGraphPoint[];
} & CommonUseGraphReturnType;
export function useGraphForAccounts(params: useGraphForAccountsParams): {
    graphPoints: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[];
} & CommonUseGraphReturnType {
    const {
        accounts,
        baseCurrencyCode,
        endOfTimeFrameDate,
        startOfTimeFrameDate,
        isPortfolioGraph,
        isElectrumBackend,
    } = params;
    const [graphPoints, setGraphPoints] = useState<
        FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[]
    >([]);
    const [graphEvents, setGraphEvents] = useState<GroupedBalanceMovementEvent[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const isDiscoveryActive = useSelector(selectHasRunningDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const dispatch = useDispatch();

    const lastFetchTimestamp = useRef<number | null>(null);

    const fetchGraphValues = useCallback(
        async ({ forceRefetch = false }: { forceRefetch?: boolean } = {}) => {
            if (isPortfolioGraph && isDiscoveryActive) {
                // The graph waits until the discovery is finished, before starting to fetch values.
                setIsLoading(true);
                setError(null);
            } else if (A.isEmpty(accounts)) {
                setIsLoading(false);
                setError(new Error('Graph is not available for testnet coins.'));
            } else {
                const fetchTimestamp = Date.now();
                lastFetchTimestamp.current = fetchTimestamp;

                setIsLoading(true);
                try {
                    const { points, events } = await fetchGraphData({
                        accounts,
                        baseCurrencyCode,
                        startOfTimeFrameDate,
                        endOfTimeFrameDate,
                        // Transaction events are displayed only in the single account detail graph.
                        eventsAccount: isPortfolioGraph ? undefined : accounts[0],
                        isElectrumBackend,
                        forceRefetch,
                        dispatch,
                    });

                    if (events) {
                        // We need to set events after graph points, othewise it will mess up events randomly
                        // because of strange useEffect in AnimatedLineGraph component
                        setGraphEvents(events);
                    }

                    // If the fetch was interrupted by a new fetch, do not set the values.
                    if (lastFetchTimestamp.current !== fetchTimestamp) return;

                    setError(null);
                    setGraphPoints(points);
                } catch (err) {
                    // rethrow error because we get stack trace in console
                    console.error(err);
                    // If the fetch was interrupted by a new fetch, do not set error.
                    if (lastFetchTimestamp.current !== fetchTimestamp) return;
                    setError(err as Error);
                }
                setIsLoading(false);
            }
        },
        [
            isPortfolioGraph,
            isDiscoveryActive,
            accounts,
            baseCurrencyCode,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
            isElectrumBackend,
            dispatch,
        ],
    );

    const refetch = useCallback(() => fetchGraphValues({ forceRefetch: true }), [fetchGraphValues]);

    useEffect(() => {
        if (isDeviceAuthorized) {
            fetchGraphValues();
        }
    }, [fetchGraphValues, isDeviceAuthorized]);

    return { graphPoints, graphEvents, isLoading, error, refetch };
}

export const useGetTimeFrameForHistoryHours = (timeframeHours: number | null) =>
    useMemo(() => getTimeFrameForHistoryHours(timeframeHours), [timeframeHours]);
