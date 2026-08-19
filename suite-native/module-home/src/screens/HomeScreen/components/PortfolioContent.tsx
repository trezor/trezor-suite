import { forwardRef } from 'react';
import { type ScrollViewProps } from 'react-native';

import { Assets } from '@suite-native/assets';

import { type PortfolioGraphRef } from './PortfolioGraph';
import { PortfolioListFooter } from './PortfolioListFooter';
import { PortfolioListHeader } from './PortfolioListHeader';

type PortfolioContentProps = {
    refreshControl?: ScrollViewProps['refreshControl'];
};

export const PortfolioContent = forwardRef<PortfolioGraphRef, PortfolioContentProps>(
    ({ refreshControl }, ref) => (
        <Assets
            refreshControl={refreshControl}
            ListHeaderComponent={<PortfolioListHeader ref={ref} />}
            ListFooterComponent={<PortfolioListFooter />}
        />
    ),
);

PortfolioContent.displayName = 'PortfolioContent';
