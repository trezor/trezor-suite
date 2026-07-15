import { forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    selectHasDeviceHistoryEnabledAccounts,
    useGraphAtoms,
    useGraphForAllDeviceAccounts,
} from '@suite-native/graph';

import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';
import { IgnoredNetworksBanner } from './IgnoredNetworksBanner';
import { PortfolioGraphTimeSwitch } from './PortfolioGraphTimeSwitch';
import { PortfolioHeader } from './PortfolioHeader';

export type PortfolioGraphRef = {
    refetchGraph: () => Promise<void>;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    const { graphPoints, error, isLoading, isAnyMainnetAccountPresent, refetch } =
        useGraphForAllDeviceAccounts({
            baseCurrencyCode,
        });

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

    const showHeader = isAnyMainnetAccountPresent || isLoading;

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            {showHeader && (
                <PortfolioHeader isLoading={isLoading} totalFiatBalance={totalFiatBalance} />
            )}
            {showGraph && (
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
            )}
            <IgnoredNetworksBanner />
            {showGraph && <PortfolioGraphTimeSwitch />}
        </VStack>
    );
});
