import { Box } from '@suite-native/atoms';

import { PortfolioAssetsFeedback } from './PortfolioAssetsFeedback';
import { PortfolioAssetsShowMore } from './PortfolioAssetsShowMore';

type PortfolioAssetsListFooterProps = {
    isListExpanded: boolean;
    onShowMorePress: () => void;
};

export const PortfolioAssetsListFooter = ({
    isListExpanded,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => (
    <Box paddingBottom="sp24">
        <PortfolioAssetsShowMore isExpanded={isListExpanded} onPress={onShowMorePress} />
        <PortfolioAssetsFeedback />
    </Box>
);
