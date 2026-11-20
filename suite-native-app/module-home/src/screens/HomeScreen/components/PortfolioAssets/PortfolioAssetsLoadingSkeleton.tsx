import { useSelector } from 'react-redux';

import { selectHomeAssetGrouping } from '@suite-common/assets';
import { WalletAssetCardSegment } from '@suite-native/assets';
import { Box, Divider, ListItemSkeleton } from '@suite-native/atoms';

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
        <WalletAssetCardSegment isFirst={isFirst} isLast={isLast}>
            {grouping === 'networks' && !isFirst && <Divider />}
            <Box testID="@home/portfolio-assets/loading-skeleton">
                <ListItemSkeleton />
            </Box>
        </WalletAssetCardSegment>
    );
};
