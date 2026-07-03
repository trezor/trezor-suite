import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type WritableAtom, useSetAtom } from 'jotai';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceAuthorized } from '@suite-common/device';
import {
    type AccountItem,
    type CommonUseGraphParams,
    type FiatGraphPoint,
    useGetTimeFrameForHistoryHours,
    useGraphForAccounts,
} from '@suite-common/graph';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type BlockchainRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectHasRunningDiscovery,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

import { timeSwitchItems } from './components/TimeSwitch';
import { refetchPortfolioGraphThunk } from './graphThunks';
import { selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning } from './selectors';
import {
    type GraphSliceRootState,
    selectAccountGraphTimeframe,
    selectPortfolioGraphTimeframe,
    setAccountGraphTimeframe,
} from './slice';
import { type TimeframeHoursValue } from './types';
import { checkAndReportGraphError } from './utils';

const useWatchTimeframeChangeForAnalytics = (
    timeframeHours: TimeframeHoursValue,
    symbol?: NetworkSymbol,
) => {
    const isFirstRender = useRef(true);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    useEffect(() => {
        if (isFirstRender.current) {
            // Do not report default value on first render.
            isFirstRender.current = false;

            return;
        }

        const timeframeKey = timeSwitchItems.find(
            item => item.valueBackInHours === timeframeHours,
        )?.key;

        if (timeframeKey && symbol) {
            // TODO: Report tokenSymbol and tokenAddress if displaying ERC20 token account graph.
            // related to issue: https://github.com/trezor/trezor-suite/issues/7839
            analytics.report({
                type: events.assetDetailTimeframeChangeEvent.name,
                payload: { timeframe: timeframeKey, assetSymbol: symbol },
            });
        }
    }, [timeframeHours, symbol, isFirstRender, analytics]);
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

/**
 * Watches the portfolio graph fetch inputs and refetches the graph data into
 * `portfolioGraphAtoms` whenever any of them changes. Components of the graph subscribe
 * to the atoms directly, so this hook returns nothing and no props have to be drilled.
 */
export const usePortfolioGraphData = () => {
    const dispatch = useDispatch();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);
    const accountItems = useSelector(selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning);
    const portfolioGraphTimeframe = useSelector(selectPortfolioGraphTimeframe);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, 'btc'),
    );

    useEffect(() => {
        if (!isDeviceAuthorized) return;

        dispatch(refetchPortfolioGraphThunk({}));
        // The thunk reads all the fetch inputs from the store by itself. They are listed
        // as dependencies only to trigger a refetch whenever any of them changes.
    }, [
        dispatch,
        isDeviceAuthorized,
        hasRunningDiscovery,
        accountItems,
        portfolioGraphTimeframe,
        baseCurrencyCode,
        isElectrumBackend,
    ]);
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
