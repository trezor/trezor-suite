import { WalletAssetCardSegment } from '@suite-native/assets';
import { Divider } from '@suite-native/atoms';

import { type PortfolioAssetListEntry } from './portfolioAssetListSelectors';

type PortfolioAssetListSeparatorProps = {
    trailingItem?: PortfolioAssetListEntry;
};

export const PortfolioAssetListSeparator = ({ trailingItem }: PortfolioAssetListSeparatorProps) =>
    trailingItem?.type === 'network' ? (
        <WalletAssetCardSegment>
            <Divider />
        </WalletAssetCardSegment>
    ) : null;
