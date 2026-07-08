import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    type RefetchPortfolioGraphParams,
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
    useGraphGestureHandlers,
} from '@suite-native/graph';

type PortfolioLineGraphProps = {
    refetchPortfolioGraph: (params?: RefetchPortfolioGraphParams) => void;
};

export const PortfolioLineGraph = ({ refetchPortfolioGraph }: PortfolioLineGraphProps) => {
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

    const graphPoints = useAtomValue(portfolioGraphAtoms.graphPointsAtom);
    const isLoading = useAtomValue(portfolioGraphAtoms.isLoadingAtom);
    const error = useAtomValue(portfolioGraphAtoms.errorAtom);

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    const { setSelectedPoint, handleGestureEnd } = useGraphGestureHandlers(
        portfolioGraphAtoms.selectedPointAtom,
    );

    const handleTryAgain = useCallback(() => {
        refetchPortfolioGraph({ forceRefetch: true });
    }, [refetchPortfolioGraph]);

    if (!showGraph) return null;

    return (
        <Graph
            points={graphPoints}
            loading={isLoading}
            loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
            onPointSelected={setSelectedPoint}
            onGestureEnd={handleGestureEnd}
            onTryAgain={handleTryAgain}
            error={error?.message}
        />
    );
};
