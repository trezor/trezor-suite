import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    type RefetchGraphParams,
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
    selectPortfolioGraphError,
    selectPortfolioGraphIsLoading,
    useGraphGestureHandlers,
} from '@suite-native/graph';

type PortfolioLineGraphProps = {
    refetchGraph: (params?: RefetchGraphParams) => void;
};

export const PortfolioLineGraph = ({ refetchGraph }: PortfolioLineGraphProps) => {
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

    const graphPoints = useAtomValue(portfolioGraphAtoms.graphPointsAtom);
    const isLoading = useSelector(selectPortfolioGraphIsLoading);
    const error = useSelector(selectPortfolioGraphError);

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    const { setSelectedPoint, handleGestureEnd } = useGraphGestureHandlers(
        portfolioGraphAtoms.selectedPointAtom,
    );

    const handleTryAgain = useCallback(() => {
        refetchGraph({ forceRefetch: true });
    }, [refetchGraph]);

    if (!showGraph) return null;

    return (
        <Graph
            points={graphPoints}
            loading={isLoading}
            loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
            onPointSelected={setSelectedPoint}
            onGestureEnd={handleGestureEnd}
            onTryAgain={handleTryAgain}
            error={error}
        />
    );
};
