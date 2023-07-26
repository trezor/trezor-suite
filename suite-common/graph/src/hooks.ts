import { useCallback, useEffect, useMemo, useState } from 'react';

import { roundToNearestMinutes, subHours } from 'date-fns';
import { A } from '@mobily/ts-belt';

import { FiatCurrencyCode } from '@suite-common/suite-config';

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

    const refetch = useCallback(() => {
        // this is used to trigger to force re-run of useEffect lower
        setRefetchToken(previousRefetchToken => previousRefetchToken + 1);
    }, []);

    useEffect(() => {
        // if there are no accounts, that means that user has only testnets imported.
        if (A.isEmpty(accounts)) {
            setIsLoading(false);
            setError('Graph is not available for testnet coins.');
        }

        let shouldSetValues = true;

        const getGraphValues = async () => {
            if (accounts.length === 0) return;

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
