import { forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import {
    type RefetchGraphParams,
    getPortfolioGraphInstanceId,
    selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning,
    selectPortfolioGraphTimeframe,
    useGraphData,
} from '@suite-native/graph';

import { IgnoredNetworksBanner } from './IgnoredNetworksBanner';
import { PortfolioGraphTimeSwitch } from './PortfolioGraphTimeSwitch';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioLineGraph } from './PortfolioLineGraph';

export type PortfolioGraphRef = {
    refetchGraph: (params?: RefetchGraphParams) => void;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const accounts = useSelector(selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning);
    const timeframeHours = useSelector(selectPortfolioGraphTimeframe);

    const { refetchGraph } = useGraphData({
        instanceId: getPortfolioGraphInstanceId(),
        accounts,
        isDiscoveryRunning,
        timeframeHours,
        backendSymbol: asNetworkSymbol('btc'),
    });

    useImperativeHandle(
        ref,
        () => ({
            refetchGraph,
        }),
        [refetchGraph],
    );

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            <PortfolioHeader />
            <PortfolioLineGraph refetchGraph={refetchGraph} />
            <IgnoredNetworksBanner />
            <PortfolioGraphTimeSwitch />
        </VStack>
    );
});
