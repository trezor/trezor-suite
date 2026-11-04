import { Divider } from '@suite-native/atoms';

import { PortfolioAssetsCardSegment } from './PortfolioAssetsCardSegment';
import { type PortfolioAssetListEntry } from './portfolioAssetListSelectors';

type PortfolioAssetListSeparatorProps = {
    trailingItem?: PortfolioAssetListEntry;
};

export const PortfolioAssetListSeparator = ({ trailingItem }: PortfolioAssetListSeparatorProps) =>
    trailingItem?.type === 'network' ? (
        <PortfolioAssetsCardSegment>
            <Divider />
        </PortfolioAssetsCardSegment>
    ) : null;
