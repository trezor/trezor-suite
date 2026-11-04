import { Box } from '@suite-native/atoms';

import { PortfolioAssetsFeedback } from './PortfolioAssetsFeedback';
import { PortfolioAssetsLoadingSkeleton } from './PortfolioAssetsLoadingSkeleton';
import { PortfolioAssetsShowMore } from './PortfolioAssetsShowMore';

type PortfolioAssetsListFooterProps = {
    isListExpanded: boolean;
    isListEmpty: boolean;
    isFoldable: boolean;
    isLoadingSkeletonVisible: boolean;
    onShowMorePress: () => void;
};

export const PortfolioAssetsListFooter = ({
    isListExpanded,
    isListEmpty,
    isFoldable,
    isLoadingSkeletonVisible,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => (
    <Box paddingBottom="sp24">
        {isLoadingSkeletonVisible && (
            <PortfolioAssetsLoadingSkeleton isFirst={isListEmpty} isLast={!isFoldable} />
        )}
        <PortfolioAssetsShowMore isExpanded={isListExpanded} onPress={onShowMorePress} />
        <PortfolioAssetsFeedback />
    </Box>
);
