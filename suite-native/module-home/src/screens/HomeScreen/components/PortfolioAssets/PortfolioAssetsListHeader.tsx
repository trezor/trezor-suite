import { useSelector } from 'react-redux';

import { selectHasShownWalletAssets } from '@suite-common/assets';

import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';
import { PortfolioAssetsNewBanner } from './PortfolioAssetsNewBanner';
import { PortfolioAssetsSectionHeader } from './PortfolioAssetsSectionHeader';

type PortfolioAssetsListHeaderProps = {
    onViewOptionsPress: () => void;
};

export const PortfolioAssetsListHeader = ({
    onViewOptionsPress,
}: PortfolioAssetsListHeaderProps) => {
    const hasAssets = useSelector(selectHasShownWalletAssets);

    return (
        <>
            <PortfolioAssetsHeader />
            {hasAssets && (
                <>
                    <PortfolioAssetsSectionHeader onViewOptionsPress={onViewOptionsPress} />
                    <PortfolioAssetsNewBanner />
                </>
            )}
        </>
    );
};
