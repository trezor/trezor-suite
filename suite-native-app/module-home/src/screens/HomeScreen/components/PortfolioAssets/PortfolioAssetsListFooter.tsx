import { Box, VStack } from '@suite-native/atoms';

import { ReferralButton } from '../ReferralButton';
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
    <VStack spacing="sp16">
        <Box>
            {isLoadingSkeletonVisible && (
                <PortfolioAssetsLoadingSkeleton isFirst={isListEmpty} isLast={!isFoldable} />
            )}
            <PortfolioAssetsShowMore isExpanded={isListExpanded} onPress={onShowMorePress} />
        </Box>
        {!isListEmpty && <PortfolioAssetsFeedback />}
        <Box marginHorizontal="sp16">
            <ReferralButton />
        </Box>
    </VStack>
);
