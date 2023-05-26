import { useCallback, useEffect, useMemo, useState } from 'react';

import { roundToNearestMinutes, subHours } from 'date-fns';
import { A } from '@mobily/ts-belt';

import { FiatCurrencyCode } from '@suite-common/suite-config';

import { getMultipleAccountBalanceHistoryWithFiat } from './graphDataFetching';
import { AccountItem, FiatGraphPoint, FiatGraphPointWithCryptoBalance } from './types';

export type CommonUseGraphParams = {
    fiatCurrency: FiatCurrencyCode;
};

// if start date is null we are fetching all data till first account movement
type StartOfTimeFrameDate = Date | null;

export const useGraphForAccounts = ({
    accounts,
    fiatCurrency,
    endOfTimeFrameDate,
    startOfTimeFrameDate,
}: CommonUseGraphParams & {
    accounts: AccountItem[];
    endOfTimeFrameDate: Date;
    startOfTimeFrameDate: StartOfTimeFrameDate;
}) => {
    const [graphPoints, setGraphPoints] = useState<
        FiatGraphPointWithCryptoBalance[] | FiatGraphPoint[]
    >([]);
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

        let shouldSetPoints = true;

        const getGraphPoints = async () => {
            if (accounts.length === 0) return;

            setIsLoading(true);

            try {
                const points = await getMultipleAccountBalanceHistoryWithFiat({
                    accounts,
                    fiatCurrency,
                    startOfTimeFrameDate,
                    endOfTimeFrameDate,
                });

                if (shouldSetPoints) {
                    setGraphPoints(points);
                    setError(null);
                }
            } catch (err) {
                setError(err?.message);
            }

            setIsLoading(false);
        };

        getGraphPoints();

        return () => {
            shouldSetPoints = false;
        };
    }, [accounts, fiatCurrency, refetchToken, endOfTimeFrameDate, startOfTimeFrameDate]);

    return { graphPoints, isLoading, error, refetch };
};

export const useGetTimeFrameForHistoryHours = (hoursToHistory: number | null) =>
    useMemo(() => {
        const endOfTimeFrameDate = roundToNearestMinutes(new Date(), {
            nearestTo: 10,
            roundingMethod: 'floor',
        });
        const startOfTimeFrameDate = hoursToHistory
            ? subHours(endOfTimeFrameDate, hoursToHistory)
            : null;

        return { endOfTimeFrameDate, startOfTimeFrameDate };
    }, [hoursToHistory]);
