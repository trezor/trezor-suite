import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { roundToNearestMinutes, subHours } from 'date-fns';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectAccountByKey, selectAccounts } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

import { getMultipleAccountBalanceHistoryWithFiat } from './graphDataFetching';
import { AccountItem, FiatGraphPoint, FiatGraphPointWithCryptoBalance } from './types';

const getTimeFrameForHistoryHours = (hoursToHistory: number | null) => {
    const endOfTimeFrameDate = roundToNearestMinutes(new Date(), {
        nearestTo: 10,
        roundingMethod: 'floor',
    });
    const startOfTimeFrameDate = hoursToHistory
        ? subHours(endOfTimeFrameDate, hoursToHistory)
        : null;

    return { startOfTimeFrameDate, endOfTimeFrameDate };
};

type CommonUseGraphParams = {
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

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
}: CommonUseGraphParams & { accountKey: AccountKey }) => {
    const account = useSelector((state: any) => selectAccountByKey(state, accountKey));
    const [hoursToHistory, setHoursToHistory] = useState<number | null>(24);
    const { startOfTimeFrameDate, endOfTimeFrameDate } = useMemo(
        () => getTimeFrameForHistoryHours(hoursToHistory),
        [hoursToHistory],
    );

    const accounts = useMemo(() => {
        if (!account) return [];
        return [
            {
                coin: account.symbol,
                descriptor: account.descriptor,
            },
        ] as AccountItem[];
    }, [account]);

    return {
        ...useGraphForAccounts({
            accounts,
            fiatCurrency,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
        }),
        hoursToHistory,
        setHoursToHistory,
    };
};

export const useGraphForAllAccounts = ({ fiatCurrency }: CommonUseGraphParams) => {
    const accounts = useSelector(selectAccounts);
    const [hoursToHistory, setHoursToHistory] = useState<number | null>(24);
    const { startOfTimeFrameDate, endOfTimeFrameDate } = useMemo(
        () => getTimeFrameForHistoryHours(hoursToHistory),
        [hoursToHistory],
    );

    const accountItems = useMemo(
        () =>
            accounts.map(account => ({
                coin: account.symbol,
                descriptor: account.descriptor,
            })),
        [accounts],
    );

    return {
        ...useGraphForAccounts({
            accounts: accountItems,
            fiatCurrency,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
        }),
        hoursToHistory,
        setHoursToHistory,
    };
};
