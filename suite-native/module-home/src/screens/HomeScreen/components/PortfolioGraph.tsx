import { forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Box, Text, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    TimeSwitch,
    selectDeviceHistoryIgnoredNetworkSymbols,
    selectHasDeviceHistoryEnabledAccounts,
    useGraphAtoms,
    useGraphForAllDeviceAccounts,
} from '@suite-native/graph';
import { Translation } from '@suite-native/intl';

import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';
import { PortfolioHeader } from './PortfolioHeader';

export type PortfolioGraphRef = {
    refetchGraph: () => Promise<void>;
};

const IgnoredNetworksBanner = () => {
    const graphIgnoredNetworkSymbols = useSelector(selectDeviceHistoryIgnoredNetworkSymbols);

    if (!graphIgnoredNetworkSymbols.length) {
        return null;
    }

    const networksString = graphIgnoredNetworkSymbols
        .map(symbol => getNetwork(symbol).name)
        .join(', ');

    return (
        <Box paddingHorizontal="sp16">
            <Text textAlign="center" variant="body-sm" color="contentSecondary">
                <Translation id="moduleHome.graphIgnoredNetworks" values={{ networksString }} />
            </Text>
        </Box>
    );
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    const {
        graphPoints,
        error,
        isLoading,
        isAnyMainnetAccountPresent,
        refetch,
        onSelectTimeFrame,
        timeframe,
    } = useGraphForAllDeviceAccounts({
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
            {showGraph && (
                <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
            )}
        </VStack>
    );
});
