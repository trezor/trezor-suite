import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import {
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
    selectHasPortfolioGraphAccounts,
    usePortfolioGraphData,
} from '@suite-native/graph';

import { IgnoredNetworksBanner } from './IgnoredNetworksBanner';
import { PortfolioGraphTimeSwitch } from './PortfolioGraphTimeSwitch';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioLineGraph } from './PortfolioLineGraph';

export const PortfolioGraph = () => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasPortfolioGraphAccounts = useSelector(selectHasPortfolioGraphAccounts);
    const isLoading = useAtomValue(portfolioGraphAtoms.isLoadingAtom);

    usePortfolioGraphData();

    const showHeader = hasPortfolioGraphAccounts || isLoading;

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            {showHeader && <PortfolioHeader />}
            <PortfolioLineGraph />
            <IgnoredNetworksBanner />
            {showGraph && <PortfolioGraphTimeSwitch />}
        </VStack>
    );
};
