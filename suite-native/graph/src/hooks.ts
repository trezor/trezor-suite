import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AccountItem,
    CommonUseGraphParams,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import {
    AccountsRootState,
    selectAccountByKey,
    selectDeviceMainnetAccounts,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { analytics, EventType } from '@suite-native/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { timeSwitchItems } from './components/TimeSwitch';
import { TimeframeHoursValue } from './types';
import {
    GraphSliceRootState,
    selectAccountGraphTimeframe,
    selectPortfolioGraphTimeframe,
    setAccountGraphTimeframe,
    setPortfolioGraphTimeframe,
} from './slice';

const useWatchTimeframeChangeForAnalytics = (
    timeframeHours: TimeframeHoursValue,
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
            item => item.valueBackInHours === timeframeHours,
        )?.label;

        if (timeframeLabel) {
            if (networkSymbol) {
                // TODO: Report tokenSymbol and tokenAddress if displaying ERC20 token account graph.
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
    }, [timeframeHours, networkSymbol, isFirstRender]);
};

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
}: CommonUseGraphParams & { accountKey: AccountKey }) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountGraphTimeframe = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphTimeframe(state, accountKey),
    );

    const handleSelectAccountTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) =>
            dispatch(setAccountGraphTimeframe({ accountKey, timeframeHours })),
        [dispatch, accountKey],
    );

    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(accountGraphTimeframe);

    const accounts = useMemo(() => {
        if (!account) return [];
        return [
            {
                coin: account.symbol,
                descriptor: account.descriptor,
            },
        ] as AccountItem[];
    }, [account]);

    useWatchTimeframeChangeForAnalytics(accountGraphTimeframe, account?.symbol);

    return {
        ...useGraphForAccounts({
            accounts,
            fiatCurrency,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
            isPortfolioGraph: false,
        }),
        timeframe: accountGraphTimeframe,
        onSelectTimeFrame: handleSelectAccountTimeframe,
    };
};

export const useGraphForAllDeviceAccounts = ({ fiatCurrency }: CommonUseGraphParams) => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectDeviceMainnetAccounts);
    const portfolioGraphTimeframe = useSelector(selectPortfolioGraphTimeframe);

    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(portfolioGraphTimeframe);

    const accountItems = useMemo(
        () =>
            accounts.map(account => ({
                coin: account.symbol,
                descriptor: account.descriptor,
            })),
        [accounts],
    );

    const handleSelectPortfolioTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) =>
            dispatch(setPortfolioGraphTimeframe({ timeframeHours })),
        [dispatch],
    );

    useWatchTimeframeChangeForAnalytics(portfolioGraphTimeframe);

    return {
        ...useGraphForAccounts({
            accounts: accountItems,
            fiatCurrency,
            startOfTimeFrameDate,
            endOfTimeFrameDate,
            isPortfolioGraph: true,
        }),
        timeframe: portfolioGraphTimeframe,
        onSelectTimeFrame: handleSelectPortfolioTimeframe,
    };
};
