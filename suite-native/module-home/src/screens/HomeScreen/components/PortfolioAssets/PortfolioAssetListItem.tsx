import { type ListRenderItemInfo } from '@shopify/flash-list';

import { Text } from '@suite-native/atoms';

export type PortfolioAssetItem = {
    id: string;
    label: string;
};

type PortfolioAssetListItemProps = ListRenderItemInfo<PortfolioAssetItem>;

export const PortfolioAssetListItem = ({ item }: PortfolioAssetListItemProps) => (
    <Text>{item.label}</Text>
);
