import { useSelector } from 'react-redux';

import { selectHasHiddenWalletAssets, selectHasShownWalletAssets } from '@suite-common/assets';

import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';
import { PortfolioAssetsNewBanner } from './PortfolioAssetsNewBanner';
import { PortfolioAssetsSectionHeader } from './PortfolioAssetsSectionHeader';

type PortfolioAssetsListHeaderProps = {
    onViewOptionsPress: () => void;
};

export const PortfolioAssetsListHeader = ({
    onViewOptionsPress,
}: PortfolioAssetsListHeaderProps) => {
    const hasShownAssets = useSelector(selectHasShownWalletAssets);
    // View options is the only way to the hidden tokens, so a wallet holding nothing else still needs it.
    const hasHiddenAssets = useSelector(selectHasHiddenWalletAssets);

    return (
        <>
            <PortfolioAssetsHeader />
            {(hasShownAssets || hasHiddenAssets) && (
                <PortfolioAssetsSectionHeader onViewOptionsPress={onViewOptionsPress} />
            )}
            {hasShownAssets && <PortfolioAssetsNewBanner />}
        </>
    );
};
