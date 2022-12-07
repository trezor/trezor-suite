import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountItem,
    CommonUseGraphParams,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import { selectAccountByKey, selectAccounts } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
}: CommonUseGraphParams & { accountKey: AccountKey }) => {
    const account = useSelector((state: any) => selectAccountByKey(state, accountKey));
    const [hoursToHistory, setHoursToHistory] = useState<number | null>(24);
    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(hoursToHistory);

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
    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(hoursToHistory);

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
