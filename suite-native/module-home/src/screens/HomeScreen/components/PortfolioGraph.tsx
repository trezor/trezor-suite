import { forwardRef } from 'react';
import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import {
    selectHasDeviceHistoryEnabledAccounts,
    useGraphForAllDeviceAccounts,
} from '@suite-native/graph';

import { IgnoredNetworksBanner } from './IgnoredNetworksBanner';
import { PortfolioGraphTimeSwitch } from './PortfolioGraphTimeSwitch';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioLineGraph } from './PortfolioLineGraph';

export type PortfolioGraphRef = {
    refetchGraph: () => Promise<void>;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);

    const { graphPoints, error, isLoading, isAnyMainnetAccountPresent, refetch } =
        useGraphForAllDeviceAccounts({
            baseCurrencyCode,
        });

    const showHeader = isAnyMainnetAccountPresent || isLoading;

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            {showHeader && <PortfolioHeader isLoading={isLoading} />}
            <PortfolioLineGraph
                ref={ref}
                graphPoints={graphPoints}
                error={error}
                isLoading={isLoading}
                refetch={refetch}
            />
            <IgnoredNetworksBanner />
            {showGraph && <PortfolioGraphTimeSwitch />}
        </VStack>
    );
});
