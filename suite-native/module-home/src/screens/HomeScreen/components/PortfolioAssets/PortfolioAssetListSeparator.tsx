import { Divider } from '@suite-native/atoms';

import { type PortfolioAssetListEntry } from './portfolioAssetListSelectors';

type PortfolioAssetListSeparatorProps = {
    trailingItem?: PortfolioAssetListEntry;
};

export const PortfolioAssetListSeparator = ({ trailingItem }: PortfolioAssetListSeparatorProps) =>
    trailingItem?.type === 'asset' && trailingItem.isInNetworkGroup ? null : <Divider />;
