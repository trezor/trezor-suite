import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { captureException } from '@sentry/react-native';
import { WritableAtom, useSetAtom } from 'jotai';

import {
    AccountItem,
    CommonUseGraphParams,
    FiatGraphPoint,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    BlockchainRootState,
    selectAccountByKey,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@suite-native/analytics';

import { timeSwitchItems } from './components/TimeSwitch';
import { selectPortfolioGraphAccountItems } from './selectors';
import {
    GraphSliceRootState,
    selectAccountGraphTimeframe,
    selectPortfolioGraphTimeframe,
    setAccountGraphTimeframe,
    setPortfolioGraphTimeframe,
} from './slice';
import { TimeframeHoursValue } from './types';
import { omitErrorMessageSensitiveData } from './utils';

const useWatchTimeframeChangeForAnalytics = (
    timeframeHours: TimeframeHoursValue,
    symbol?: NetworkSymbol,
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
            if (symbol) {
                // TODO: Report tokenSymbol and tokenAddress if displaying ERC20 token account graph.
                // related to issue: https://github.com/trezor/trezor-suite/issues/7839
                analytics.report({
                    type: EventType.AssetDetailTimeframeChange,
                    payload: { timeframe: timeframeLabel, assetSymbol: symbol },
                });
            } else {
                analytics.report({
                    type: EventType.WatchPortfolioTimeframeChange,
                    payload: { timeframe: timeframeLabel },
                });
            }
        }
    }, [timeframeHours, symbol, isFirstRender]);
};

const checkAndReportGraphError = (error: Error | null) => {
    if (error) {
        // new Error object has to be created, to not override the original data
        const errorCopy = new Error(omitErrorMessageSensitiveData(error.message));
        errorCopy.stack = omitErrorMessageSensitiveData(error.stack ?? '');
        errorCopy.name = error.name;

        captureException(errorCopy);
    }
};

export const useGraphForSingleAccount = ({
    accountKey,
    fiatCurrency,
    tokensFilter,
    hideMainAccount = false,
}: CommonUseGraphParams & Omit<AccountItem, 'symbol' | 'descriptor'>) => {
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
                symbol: account.symbol,
                descriptor: account.descriptor,
                accountKey: account.key,
                identity,
                hideMainAccount,
                tokensFilter,
            },
        ];
        // We need to specify all dependicies here, because whole account will be updated very often will could result in endless rerendering.
    }, [
        identity,
        account?.symbol,
        account?.descriptor,
        account?.key,
        hideMainAccount,
        tokensFilter,
    ]);

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
    // if we memoize selectPortfolioGraphAccountItems, it will randomly break so we need to use deep comparison instead to prevent unnecessary rerenders
    const accountItems = useSelectorDeepComparison(selectPortfolioGraphAccountItems);
    const portfolioGraphTimeframe = useSelector(selectPortfolioGraphTimeframe);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, 'btc'),
    );

    const { startOfTimeFrameDate, endOfTimeFrameDate } =
        useGetTimeFrameForHistoryHours(portfolioGraphTimeframe);

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
        isAnyMainnetAccountPresent: A.isNotEmpty(accountItems),
        timeframe: portfolioGraphTimeframe,
        onSelectTimeFrame: handleSelectPortfolioTimeframe,
    };
};

export const useGraphAtoms = <TGraphPoint extends FiatGraphPoint>({
    referencePointAtom,
    selectedPointAtom,
    graphPoints,
    totalFiatBalance,
}: {
    referencePointAtom: WritableAtom<TGraphPoint | null, TGraphPoint | null>;
    selectedPointAtom: WritableAtom<TGraphPoint | null, TGraphPoint | null>;
    graphPoints: TGraphPoint[];
    totalFiatBalance: string;
}): {
    handleGestureStart: () => void;
    setInitialSelectedPoints: () => void;
    setSelectedPoint: (point: TGraphPoint) => void;
} => {
    const [isGestureActive, setIsGestureActive] = useState(false);
    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);

    const lastPoint: TGraphPoint | undefined = graphPoints[graphPoints.length - 1];
    const referencePoint: TGraphPoint | undefined = useMemo(
        () => graphPoints.find(point => point.value > 0) ?? graphPoints[0],
        [graphPoints],
    );

    useEffect(
        () => () => {
            // we should reset everything to default on unmount otherwise it will broke loading state when navigating to same or another account
            setSelectedPoint(null);
            setReferencePoint(null);
        },
        [setSelectedPoint, setReferencePoint],
    );

    const setInitialSelectedPoints = useCallback(() => {
        setIsGestureActive(false);
        if (lastPoint && referencePoint) {
            setSelectedPoint({
                ...lastPoint,
                valueLatestTotal: totalFiatBalance,
            });
            setReferencePoint(referencePoint);
        }
    }, [lastPoint, referencePoint, setSelectedPoint, setReferencePoint, totalFiatBalance]);

    const handleGestureStart = useCallback(() => {
        setIsGestureActive(true);
    }, [setIsGestureActive]);

    useEffect(() => {
        if (!isGestureActive && lastPoint) {
            setSelectedPoint({
                ...lastPoint,
                valueLatestTotal: totalFiatBalance,
            });
        }
    }, [isGestureActive, setInitialSelectedPoints, totalFiatBalance, lastPoint, setSelectedPoint]);

    return {
        handleGestureStart,
        setInitialSelectedPoints,
        setSelectedPoint,
    };
};
