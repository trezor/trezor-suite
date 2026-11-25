import { Box, VStack } from '@suite-native/atoms';
import { ReferAFriendCard, useReferAFriend } from '@suite-native/refer-a-friend';

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
}: PortfolioAssetsListFooterProps) => {
    // TODO: Embed to ReferAFriendCard after launch.
    const { isReferAFriendFeatureAvailable } = useReferAFriend();

    return (
        <VStack spacing="sp16">
            <Box>
                {isLoadingSkeletonVisible && (
                    <PortfolioAssetsLoadingSkeleton isFirst={isListEmpty} isLast={!isFoldable} />
                )}
                <PortfolioAssetsShowMore isExpanded={isListExpanded} onPress={onShowMorePress} />
            </Box>
            {!isListEmpty && <PortfolioAssetsFeedback />}
            <Box marginHorizontal="sp16">
                {isReferAFriendFeatureAvailable ? <ReferAFriendCard /> : <ReferralButton />}
            </Box>
        </VStack>
    );
};
