import { forwardRef, useImperativeHandle } from 'react';

import { VStack } from '@suite-native/atoms';
import { type RefetchPortfolioGraphParams, usePortfolioGraphData } from '@suite-native/graph';

import { IgnoredNetworksBanner } from './IgnoredNetworksBanner';
import { PortfolioGraphTimeSwitch } from './PortfolioGraphTimeSwitch';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioLineGraph } from './PortfolioLineGraph';

export type PortfolioGraphRef = {
    refetchGraph: (params?: RefetchPortfolioGraphParams) => void;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const { refetchPortfolioGraph } = usePortfolioGraphData();

    useImperativeHandle(
        ref,
        () => ({
            refetchGraph: refetchPortfolioGraph,
        }),
        [refetchPortfolioGraph],
    );

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            <PortfolioHeader />
            <PortfolioLineGraph refetchPortfolioGraph={refetchPortfolioGraph} />
            <IgnoredNetworksBanner />
            <PortfolioGraphTimeSwitch />
        </VStack>
    );
});
