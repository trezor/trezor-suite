import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    portfolioGraphAtoms,
    refetchPortfolioGraphThunk,
    selectHasDeviceHistoryEnabledAccounts,
    useGraphAtoms,
} from '@suite-native/graph';

export const PortfolioLineGraph = () => {
    const dispatch = useDispatch();
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

    const graphPoints = useAtomValue(portfolioGraphAtoms.graphPointsAtom);
    const isLoading = useAtomValue(portfolioGraphAtoms.isLoadingAtom);
    const error = useAtomValue(portfolioGraphAtoms.errorAtom);

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    const { handleGestureStart, setInitialSelectedPoints, setSelectedPoint } = useGraphAtoms({
        referencePointAtom: portfolioGraphAtoms.referencePointAtom,
        selectedPointAtom: portfolioGraphAtoms.selectedPointAtom,
        graphPoints,
        totalFiatBalance,
    });

    const handleTryAgain = useCallback(() => {
        dispatch(refetchPortfolioGraphThunk({ forceRefetch: true }));
    }, [dispatch]);

    if (!showGraph) return null;

    return (
        <Graph
            points={graphPoints}
            loading={isLoading}
            loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
            onPointSelected={setSelectedPoint}
            onGestureEnd={setInitialSelectedPoints}
            onGestureStart={handleGestureStart}
            onTryAgain={handleTryAgain}
            error={error?.message}
        />
    );
};
