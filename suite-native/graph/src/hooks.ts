import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { captureException } from '@sentry/react-native';
import { type WritableAtom, useSetAtom } from 'jotai';

import {
    type AccountItem,
    type CommonUseGraphParams,
    type FiatGraphPoint,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type BlockchainRootState,
    selectAccountByKey,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { timeSwitchItems } from './components/TimeSwitch';
import { selectPortfolioGraphAccountItems } from './selectors';
import {
    type GraphSliceRootState,
    selectAccountGraphTimeframe,
    selectPortfolioGraphTimeframe,
    setAccountGraphTimeframe,
    setPortfolioGraphTimeframe,
} from './slice';
import { type TimeframeHoursValue } from './types';
import { omitErrorMessageSensitiveData } from './utils';

const useWatchTimeframeChangeForAnalytics = (
    timeframeHours: TimeframeHoursValue,
    symbol?: NetworkSymbol,
) => {
    const isFirstRender = useRef(true);
    const analytics = useAnalytics();
    useEffect(() => {
        if (isFirstRender.current) {
            // Do not report default value on first render.
            isFirstRender.current = false;

            return;
        }

        const timeframeKey = timeSwitchItems.find(
            item => item.valueBackInHours === timeframeHours,
        )?.key;

        if (timeframeKey) {
            if (symbol) {
                // TODO: Report tokenSymbol and tokenAddress if displaying ERC20 token account graph.
                // related to issue: https://github.com/trezor/trezor-suite/issues/7839
                analytics.report({
                    type: events.assetDetailTimeframeChangeEvent.name,
                    payload: { timeframe: timeframeKey, assetSymbol: symbol },
                });
            } else {
                analytics.report({
                    type: events.watchPortfolioTimeframeChangeEvent.name,
                    payload: { timeframe: timeframeKey },
                });
            }
        }
    }, [timeframeHours, symbol, isFirstRender, analytics]);
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
    baseCurrencyCode,
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
        baseCurrencyCode,
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

export const useGraphForAllDeviceAccounts = ({ baseCurrencyCode }: CommonUseGraphParams) => {
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
        baseCurrencyCode,
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

type UseGraphAtomsParams<TGraphPoint extends FiatGraphPoint> = {
    referencePointAtom: WritableAtom<TGraphPoint | null, [TGraphPoint | null], void>;
    selectedPointAtom: WritableAtom<TGraphPoint | null, [TGraphPoint | null], void>;
    graphPoints: TGraphPoint[];
    totalFiatBalance?: BaseCurrencyAmount;
};

export const useGraphAtoms = <TGraphPoint extends FiatGraphPoint>({
    referencePointAtom,
    selectedPointAtom,
    graphPoints,
    totalFiatBalance,
}: UseGraphAtomsParams<TGraphPoint>): {
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
