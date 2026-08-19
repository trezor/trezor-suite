import { useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDiscoveredDeviceAccountless } from '@suite-common/wallet-core';
import { Assets } from '@suite-native/assets';
import { useScrollDivider } from '@suite-native/scrollview';

import { type PortfolioGraphRef } from './PortfolioGraph';
import { PortfolioListFooter } from './PortfolioListFooter';
import { PortfolioListHeader } from './PortfolioListHeader';
import { useHomeRefreshControl } from '../hooks/useHomeRefreshControl';

export const PortfolioContent = () => {
    const { scrollDivider, handleScroll } = useScrollDivider();
    const portfolioGraphRef = useRef<PortfolioGraphRef>(null);
    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioGraphRef,
    });

    return (
        <>
            {scrollDivider}
            <Assets
                refreshControl={refreshControl}
                ListHeaderComponent={<PortfolioListHeader ref={portfolioGraphRef} />}
                ListFooterComponent={<PortfolioListFooter />}
                onScroll={handleScroll}
                testID="@screen/mainScrollView"
            />
        </>
    );
};
