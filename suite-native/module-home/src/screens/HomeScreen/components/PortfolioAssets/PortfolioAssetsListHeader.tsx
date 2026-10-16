import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';
import { PortfolioAssetsSectionHeader } from './PortfolioAssetsSectionHeader';

type PortfolioAssetsListHeaderProps = {
    hasAssets: boolean;
    onViewOptionsPress: () => void;
};

export const PortfolioAssetsListHeader = ({
    hasAssets,
    onViewOptionsPress,
}: PortfolioAssetsListHeaderProps) => (
    <>
        <PortfolioAssetsHeader />
        {hasAssets && <PortfolioAssetsSectionHeader onViewOptionsPress={onViewOptionsPress} />}
    </>
);
