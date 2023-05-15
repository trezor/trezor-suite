import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountItem,
    CommonUseGraphParams,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import { selectAccountByKey, selectMainnetAccounts } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { analytics, EventType } from '@suite-native/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { timeSwitchItems } from './components/TimeSwitch';

type HoursValue = number | null;

const useWatchTimeframeChangeForAnalytics = (
    hoursToHistory: HoursValue,
    networkSymbol?: NetworkSymbol,
) => {
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            // Do not report default value on first render.
            isFirstRender.current = false;
            return;
        }

        const timeframeLabel = timeSwitchItems.find(
            item => item.valueBackInHours === hoursToHistory,
        )?.label;

        if (timeframeLabel) {
            if (networkSymbol) {
                // TODO: Report tokenSymbol if displaying ERC20 token account graph.
                // related to issue: https://github.com/trezor/trezor-suite/issues/7839
                analytics.report({
                    type: EventType.AssetDetailTimeframeChange,
                    payload: { timeframe: timeframeLabel, assetSymbol: networkSymbol },
                });
            } else {
                analytics.report({
                    type: EventType.WatchPortfolioTimeframeChange,
                    payload: { timeframe: timeframeLabel },
                });
            }
        }
    }, [hoursToHistory, networkSymbol, isFirstRender]);
};

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
}: CommonUseGraphParams & { accountKey: AccountKey }) => {
    const account = useSelector((state: any) => selectAccountByKey(state, accountKey));
    const [hoursToHistory, setHoursToHistory] = useState<HoursValue>(24);
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

    useWatchTimeframeChangeForAnalytics(hoursToHistory, account?.symbol);

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
    const accounts = useSelector(selectMainnetAccounts);
    const [hoursToHistory, setHoursToHistory] = useState<HoursValue>(24);
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

    useWatchTimeframeChangeForAnalytics(hoursToHistory);

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
