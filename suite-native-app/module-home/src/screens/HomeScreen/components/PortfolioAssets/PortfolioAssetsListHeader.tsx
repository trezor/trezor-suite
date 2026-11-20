import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';
import { PortfolioAssetsNewBanner } from './PortfolioAssetsNewBanner';
import { PortfolioAssetsSectionHeader } from './PortfolioAssetsSectionHeader';

type PortfolioAssetsListHeaderProps = {
    isNewBannerVisible: boolean;
    onViewOptionsPress: () => void;
};

export const PortfolioAssetsListHeader = ({
    isNewBannerVisible,
    onViewOptionsPress,
}: PortfolioAssetsListHeaderProps) => (
    <>
        <PortfolioAssetsHeader />
        <PortfolioAssetsSectionHeader onViewOptionsPress={onViewOptionsPress} />
        {isNewBannerVisible && <PortfolioAssetsNewBanner />}
    </>
);
