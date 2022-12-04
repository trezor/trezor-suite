import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { roundToNearestMinutes, subHours } from 'date-fns';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectAccountByKey, selectAccounts } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

import { getMultipleAccountBalanceHistoryWithFiat } from './graphThunks';
import { AccountItem, FiatGraphPoint, FiatGraphPointWithCryptoBalance } from './types';

type UseGraphParams = {
    fiatCurrency: FiatCurrencyCode;
};

export const useGraphForAccounts = ({
    accounts,
    fiatCurrency,
}: UseGraphParams & { accounts: AccountItem[] }) => {
    const [graphPoints, setGraphPoints] = useState<
        FiatGraphPointWithCryptoBalance[] | FiatGraphPoint[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchToken, setRefetchToken] = useState(0);
    const [hoursToHistory, setHoursToHistory] = useState<number | null>(24);

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
                const endOfTimeFrameDate = roundToNearestMinutes(new Date(), {
                    nearestTo: 10,
                    roundingMethod: 'floor',
                });
                const startOfTimeFrameDate = hoursToHistory
                    ? subHours(endOfTimeFrameDate, hoursToHistory)
                    : null;

                const points = await getMultipleAccountBalanceHistoryWithFiat({
                    accounts,
                    startOfTimeFrameDate,
                    endOfTimeFrameDate,
                    fiatCurrency,
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
    }, [accounts, hoursToHistory, fiatCurrency, refetchToken]);

    return { graphPoints, isLoading, error, refetch, setHoursToHistory, hoursToHistory };
};

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
}: UseGraphParams & { accountKey: AccountKey }) => {
    const account = useSelector((state: any) => selectAccountByKey(state, accountKey));

    const accounts = useMemo(() => {
        if (!account) return [];
        return [
            {
                coin: account.symbol,
                descriptor: account.descriptor,
            },
        ] as AccountItem[];
    }, [account]);

    return useGraphForAccounts({
        accounts,
        fiatCurrency,
    });
};

export const useGraphForAllAccounts = ({ fiatCurrency }: UseGraphParams) => {
    const accounts = useSelector(selectAccounts);

    const accountItems = useMemo(
        () =>
            accounts.map(account => ({
                coin: account.symbol,
                descriptor: account.descriptor,
            })),
        [accounts],
    );

    return useGraphForAccounts({
        accounts: accountItems,
        fiatCurrency,
    });
};
