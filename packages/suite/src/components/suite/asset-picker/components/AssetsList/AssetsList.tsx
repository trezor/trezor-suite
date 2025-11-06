import { ReactNode, useCallback, useState } from 'react';

import { BaseItemProps, VirtualizedList, useScrollShadow } from '@trezor/components';
import { mapElevationToBackgroundToken } from '@trezor/theme';

export interface AssetsListProps<T> {
    items: T[];
    itemsFingerprint: string;
    renderItem: (item: T, index: number) => ReactNode;
    height: string | number;
    minHeight?: string | number;
}

export const LIST_MIN_HEIGHT = 200;

export function AssetsList<T extends BaseItemProps>({
    items,
    itemsFingerprint,
    renderItem,
    height,
    minHeight = LIST_MIN_HEIGHT,
}: AssetsListProps<T>) {
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    const [end, setEnd] = useState(items.length);
    const onScrollEnd = useCallback(() => setEnd(end + 1000), [end]);
    const shadowColor = mapElevationToBackgroundToken({ $elevation: 0 });

    return (
        <ShadowContainer>
            <ShadowTop backgroundColor={shadowColor} />
            <VirtualizedList
                items={items}
                itemsFingerprint={itemsFingerprint}
                ref={scrollElementRef}
                onScroll={onScroll}
                renderItem={renderItem}
                onScrollEnd={onScrollEnd}
                listHeight={height}
                listMinHeight={minHeight}
            />
            <ShadowBottom backgroundColor={shadowColor} />
        </ShadowContainer>
    );
}
