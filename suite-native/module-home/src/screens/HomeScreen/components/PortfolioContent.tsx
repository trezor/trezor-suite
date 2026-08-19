import { forwardRef } from 'react';

import { Assets, type AssetsProps } from '@suite-native/assets';
import { useScrollDivider } from '@suite-native/scrollview';

import { type PortfolioGraphRef } from './PortfolioGraph';
import { PortfolioListFooter } from './PortfolioListFooter';
import { PortfolioListHeader } from './PortfolioListHeader';

type PortfolioContentProps = Pick<AssetsProps, 'refreshControl'>;

export const PortfolioContent = forwardRef<PortfolioGraphRef, PortfolioContentProps>(
    ({ refreshControl }, ref) => {
        const { scrollDivider, handleScroll } = useScrollDivider();

        return (
            <>
                {scrollDivider}
                <Assets
                    refreshControl={refreshControl}
                    ListHeaderComponent={<PortfolioListHeader ref={ref} />}
                    ListFooterComponent={<PortfolioListFooter />}
                    onScroll={handleScroll}
                />
            </>
        );
    },
);

PortfolioContent.displayName = 'PortfolioContent';
