import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type WritableAtom, useSetAtom } from 'jotai';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { type FiatGraphPoint } from '@suite-common/graph';
import {
    type AccountsRootState,
    type BlockchainRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectHasRunningDiscovery,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';

import { accountDetailGraphAtoms } from './accountDetailGraphAtoms';
import { refetchAccountGraphThunk, refetchPortfolioGraphThunk } from './graphThunks';
import { selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning } from './selectors';
import {
    type GraphSliceRootState,
    selectAccountGraphTimeframe,
    selectPortfolioGraphTimeframe,
} from './slice';

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

type UseAccountGraphDataParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

/**
 * Watches the account detail graph fetch inputs and refetches the graph data into
 * `accountDetailGraphAtoms` whenever any of them changes. The bundle is shared by all
 * account detail screens, so it is reset whenever the displayed account changes.
 */
export const useAccountGraphData = ({ accountKey, tokenContract }: UseAccountGraphDataParams) => {
    const dispatch = useDispatch();
    const resetGraph = useSetAtom(accountDetailGraphAtoms.resetGraphAtom);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountGraphTimeframe = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphTimeframe(state, accountKey),
    );
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, account?.symbol ?? 'btc'),
    );

    const identity = account ? tryGetAccountIdentity(account) : undefined;

    useEffect(
        () => () => {
            resetGraph();
        },
        [accountKey, tokenContract, resetGraph],
    );

    useEffect(() => {
        if (!isDeviceAuthorized) return;

        dispatch(refetchAccountGraphThunk({ accountKey, tokenContract }));
        // The thunk reads the other fetch inputs from the store by itself. They are listed
        // as dependencies only to trigger a refetch whenever any of them changes. Account
        // fields are listed individually, because the whole account object is updated on
        // every sync, which would cause endless refetching.
    }, [
        dispatch,
        isDeviceAuthorized,
        accountKey,
        tokenContract,
        accountGraphTimeframe,
        baseCurrencyCode,
        isElectrumBackend,
        identity,
        account?.symbol,
        account?.descriptor,
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
