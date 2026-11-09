import React, { type ReactElement, useCallback } from 'react';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { Box, Text, useScrollDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetListItem, type PositionedAssetListItem } from './AssetListItem';

export type ListRenderItem = PositionedAssetListItem | string;

type AssetListProps = {
    items: ListRenderItem[];
    onSelect: (item: PositionedAssetListItem) => void;
    ListEmptyComponent?: ReactElement;
    onEndReached?: () => void;
};

const contentStyle = prepareNativeStyle(({ spacings }) => ({
    flexGrow: 1,
    marginHorizontal: spacings.sp16,
}));

export const AssetList = ({
    items,
    onSelect,
    ListEmptyComponent,
    onEndReached,
}: AssetListProps) => {
    const { scrollDivider, handleScroll } = useScrollDivider();
    const { applyStyle } = useNativeStyles();

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<ListRenderItem>) => {
            if (typeof item === 'string') {
                return (
                    <Box marginBottom="sp12">
                        <Text color="contentSecondary">{item}</Text>
                    </Box>
                );
            }

            return <AssetListItem item={item} onSelect={onSelect} />;
        },
        [onSelect],
    );

    return (
        <>
            {scrollDivider}
            <FlashList
                contentContainerStyle={applyStyle(contentStyle)}
                data={items}
                renderItem={renderItem}
                keyExtractor={item => (typeof item === 'string' ? item : item.asset.id)}
                getItemType={item => (typeof item === 'string' ? 'header' : 'asset')}
                ListEmptyComponent={ListEmptyComponent}
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{ disabled: true }}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                onScroll={handleScroll}
            />
        </>
    );
};
