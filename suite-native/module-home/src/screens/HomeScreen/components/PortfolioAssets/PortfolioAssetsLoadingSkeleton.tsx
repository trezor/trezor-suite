import { useSelector } from 'react-redux';

import { selectHomeAssetGrouping } from '@suite-common/assets';
import { Box, Divider, ListItemSkeleton } from '@suite-native/atoms';

import { PortfolioAssetsCardSegment } from './PortfolioAssetsCardSegment';

type PortfolioAssetsLoadingSkeletonProps = {
    isFirst: boolean;
    isLast: boolean;
};

export const PortfolioAssetsLoadingSkeleton = ({
    isFirst,
    isLast,
}: PortfolioAssetsLoadingSkeletonProps) => {
    const grouping = useSelector(selectHomeAssetGrouping);

    return (
        <PortfolioAssetsCardSegment isFirst={isFirst} isLast={isLast}>
            {grouping === 'networks' && !isFirst && <Divider />}
            <Box testID="@home/portfolio-assets/loading-skeleton">
                <ListItemSkeleton />
            </Box>
        </PortfolioAssetsCardSegment>
    );
};
