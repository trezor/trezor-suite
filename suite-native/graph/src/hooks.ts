import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type PrimitiveAtom, useSetAtom } from 'jotai';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { type AccountItem, type FiatGraphPoint } from '@suite-common/graph';
import {
    type AccountsRootState,
    type BlockchainRootState,
    selectAccountByKey,
    selectBaseCurrency,
    selectHasRunningDiscovery,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
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
 * `portfolioGraphAtoms` whenever any of them changes. Graph display components subscribe
 * to the atoms directly, so only command callbacks are passed down.
 */
export type RefetchPortfolioGraphParams = {
    forceRefetch?: boolean;
};

type UsePortfolioGraphDataParams = {
    isEnabled?: boolean;
};

export const usePortfolioGraphData = ({ isEnabled = true }: UsePortfolioGraphDataParams = {}) => {
    const dispatch = useDispatch();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const accounts = useSelector(selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning);
    const timeframeHours = useSelector(selectPortfolioGraphTimeframe);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, 'btc'),
    );

    const refetchPortfolioGraph = useCallback(
        ({ forceRefetch }: RefetchPortfolioGraphParams = {}) =>
            dispatch(
                refetchPortfolioGraphThunk({
                    accounts,
                    isDiscoveryRunning,
                    timeframeHours,
                    baseCurrencyCode,
                    isElectrumBackend,
                    forceRefetch,
                }),
            ),
        [
            accounts,
            baseCurrencyCode,
            dispatch,
            isDiscoveryRunning,
            isElectrumBackend,
            timeframeHours,
        ],
    );

    useEffect(() => {
        if (!isEnabled || !isDeviceAuthorized) return;

        refetchPortfolioGraph();
    }, [isEnabled, isDeviceAuthorized, refetchPortfolioGraph]);

    return { refetchPortfolioGraph };
};

type UseAccountGraphDataParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type RefetchAccountGraphParams = {
    forceRefetch?: boolean;
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

    const accountSymbol = account?.symbol;
    const accountDescriptor = account?.descriptor;
    const selectedAccountKey = account?.key;
    const identity = account ? tryGetAccountIdentity(account) : undefined;
    const accountItem = useMemo<AccountItem | undefined>(() => {
        if (!accountSymbol || !accountDescriptor || !selectedAccountKey) return undefined;

        return {
            symbol: accountSymbol,
            descriptor: accountDescriptor,
            accountKey: selectedAccountKey,
            identity,
            hideMainAccount: !!tokenContract,
            // Pass empty array to show only the main account, or the token to show only its graph.
            tokensFilter: tokenContract ? [tokenContract] : [],
        };
    }, [accountDescriptor, accountSymbol, identity, selectedAccountKey, tokenContract]);

    const refetchAccountGraph = useCallback(
        ({ forceRefetch }: RefetchAccountGraphParams = {}) =>
            dispatch(
                refetchAccountGraphThunk({
                    accountItem,
                    timeframeHours: accountGraphTimeframe,
                    baseCurrencyCode,
                    isElectrumBackend,
                    forceRefetch,
                }),
            ),
        [accountGraphTimeframe, accountItem, baseCurrencyCode, dispatch, isElectrumBackend],
    );

    useEffect(
        () => () => {
            resetGraph();
        },
        [accountKey, tokenContract, resetGraph],
    );

    useEffect(() => {
        if (!isDeviceAuthorized) return;

        refetchAccountGraph();
    }, [isDeviceAuthorized, refetchAccountGraph]);

    return { refetchAccountGraph };
};

/**
 * Provides the swipe gesture callbacks of a graph, writing the point under the user's
 * finger into the given atom. The selected point is null while there is no gesture.
 */
export const useGraphGestureHandlers = <TGraphPoint extends FiatGraphPoint>(
    selectedPointAtom: PrimitiveAtom<TGraphPoint | null>,
) => {
    const setSelectedPoint = useSetAtom(selectedPointAtom);

    // Make sure no point stays selected when the graph unmounts mid-gesture.
    useEffect(() => () => setSelectedPoint(null), [setSelectedPoint]);

    const handleGestureEnd = useCallback(() => setSelectedPoint(null), [setSelectedPoint]);

    return { setSelectedPoint, handleGestureEnd };
};
