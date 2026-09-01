import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type PrimitiveAtom, useSetAtom } from 'jotai';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { type AccountItem, type FiatGraphPoint } from '@suite-common/graph';
import { returnStableArrayIfEmpty, useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    selectBaseCurrency,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';

import { type RefetchGraphThunkParams } from './graphThunkTypes';
import { refetchGraphThunk } from './graphThunks';

/**
 * Watches graph fetch inputs and refetches graph data whenever any of them changes.
 * Graph display components subscribe to the atoms directly, so only command callbacks are passed down.
 */
export type RefetchGraphParams = {
    forceRefetch?: boolean;
};

type UseGraphDataParams = Omit<
    RefetchGraphThunkParams,
    'accounts' | 'baseCurrencyCode' | 'forceRefetch' | 'isElectrumBackend'
> & {
    accounts?: AccountItem[];
    backendSymbol: NetworkSymbol;
    isEnabled?: boolean;
};

export const useGraphData = ({
    instanceId,
    accounts,
    eventsAccount,
    isDiscoveryRunning,
    timeframeHours,
    backendSymbol,
    isEnabled = true,
}: UseGraphDataParams) => {
    const dispatch = useDispatch();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, backendSymbol),
    );
    const graphAccounts = accounts ?? returnStableArrayIfEmpty<AccountItem>();

    const refetchGraph = useCallback(
        ({ forceRefetch }: RefetchGraphParams = {}) =>
            dispatch(
                refetchGraphThunk({
                    instanceId,
                    accounts: graphAccounts,
                    eventsAccount,
                    isDiscoveryRunning,
                    timeframeHours,
                    baseCurrencyCode,
                    isElectrumBackend,
                    forceRefetch,
                }),
            ),
        [
            baseCurrencyCode,
            dispatch,
            eventsAccount,
            graphAccounts,
            instanceId,
            isDiscoveryRunning,
            isElectrumBackend,
            timeframeHours,
        ],
    );

    useEffect(() => {
        if (!isEnabled || !isDeviceAuthorized) return;

        refetchGraph();
    }, [isEnabled, isDeviceAuthorized, refetchGraph]);

    return { refetchGraph };
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
