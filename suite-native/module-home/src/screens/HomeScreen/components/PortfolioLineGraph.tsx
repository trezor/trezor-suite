import { forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { type FiatGraphPoint } from '@suite-common/graph';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import { Graph, selectHasDeviceHistoryEnabledAccounts, useGraphAtoms } from '@suite-native/graph';

import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';
import { type PortfolioGraphRef } from './PortfolioGraph';

type PortfolioLineGraphProps = {
    graphPoints: FiatGraphPoint[];
    error: Error | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
};

export const PortfolioLineGraph = forwardRef<PortfolioGraphRef, PortfolioLineGraphProps>(
    ({ graphPoints, error, isLoading, refetch }, ref) => {
        const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
        const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
        const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);
        const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

        const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

        const { handleGestureStart, setInitialSelectedPoints, setSelectedPoint } = useGraphAtoms({
            referencePointAtom,
            selectedPointAtom,
            graphPoints,
            totalFiatBalance,
        });

        useImperativeHandle(
            ref,
            () => ({
                refetchGraph: refetch,
            }),
            [refetch],
        );

        if (!showGraph) return null;

        return (
            <Graph
                points={graphPoints}
                loading={isLoading}
                loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                onGestureStart={handleGestureStart}
                onTryAgain={refetch}
                error={error?.message}
            />
        );
    },
);
