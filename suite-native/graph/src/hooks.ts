import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { captureException } from '@sentry/react-native';

import {
    AccountItem,
    CommonUseGraphParams,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import {
    AccountsRootState,
    BlockchainRootState,
    selectAccountByKey,
    selectDeviceMainnetAccounts,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { analytics, EventType } from '@suite-native/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';

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

const checkAndReportGraphError = (error: string | null) => {
    if (error) captureException(error);
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

    const identity = account ? tryGetAccountIdentity(account) : undefined;
    const accounts = useMemo<AccountItem[]>(() => {
        if (!account?.symbol) return [];

        return [
            {
                coin: account.symbol,
                descriptor: account.descriptor,
                accountKey: account.key,
                identity,
            },
        ];
        // We need to specify all dependicies here, because whole account will be updated very often will could result in endless rerendering.
    }, [identity, account?.symbol, account?.descriptor, account?.key]);

    useWatchTimeframeChangeForAnalytics(accountGraphTimeframe, account?.symbol);

    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, account?.symbol ?? 'btc'),
    );

    const graphForAccounts = useGraphForAccounts({
        accounts,
        fiatCurrency,
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        isPortfolioGraph: false,
        isElectrumBackend,
    });

    useEffect(() => checkAndReportGraphError(graphForAccounts.error), [graphForAccounts.error]);

    return {
        ...graphForAccounts,
        timeframe: accountGraphTimeframe,
        onSelectTimeFrame: handleSelectAccountTimeframe,
    };
};

export const useGraphForAllDeviceAccounts = ({ fiatCurrency }: CommonUseGraphParams) => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectDeviceMainnetAccounts);
    const portfolioGraphTimeframe = useSelector(selectPortfolioGraphTimeframe);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, 'btc'),
    );

    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(portfolioGraphTimeframe);

    const accountItems = useMemo<AccountItem[]>(
        () =>
            accounts.map(account => ({
                coin: account.symbol,
                descriptor: account.descriptor,
                identity: tryGetAccountIdentity(account),
                accountKey: account.key,
            })),
        [accounts],
    );

    const handleSelectPortfolioTimeframe = useCallback(
        (timeframeHours: TimeframeHoursValue) => {
            if (portfolioGraphTimeframe !== timeframeHours) {
                dispatch(setPortfolioGraphTimeframe({ timeframeHours }));
            }
        },
        [dispatch, portfolioGraphTimeframe],
    );

    useWatchTimeframeChangeForAnalytics(portfolioGraphTimeframe);

    const graphForAccounts = useGraphForAccounts({
        accounts: accountItems,
        fiatCurrency,
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        isPortfolioGraph: true,
        isElectrumBackend,
    });

    useEffect(() => checkAndReportGraphError(graphForAccounts.error), [graphForAccounts.error]);

    return {
        ...graphForAccounts,
        timeframe: portfolioGraphTimeframe,
        onSelectTimeFrame: handleSelectPortfolioTimeframe,
    };
};
