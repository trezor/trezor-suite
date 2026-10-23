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
    <>
        <PortfolioAssetsShowMore isExpanded={isListExpanded} onPress={onShowMorePress} />
        <PortfolioAssetsFeedback />
    </>
);
