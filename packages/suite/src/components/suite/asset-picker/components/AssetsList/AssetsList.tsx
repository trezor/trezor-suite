import { type ReactNode, type RefObject, memo, useCallback, useState } from 'react';

import { type BaseItemProps, VirtualizedList, useScrollShadow } from '@trezor/components';
import { mapElevationToBackgroundToken } from '@trezor/theme';

export interface AssetsListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    height: string | number;
    minHeight?: string | number;
    ref?: RefObject<HTMLDivElement | null>;
}

export const LIST_MIN_HEIGHT = 200;

function AssetsListInner<T extends BaseItemProps>({
    items,
    renderItem,
    height,
    minHeight = LIST_MIN_HEIGHT,
    ref,
}: AssetsListProps<T>) {
    const { onScroll, ShadowTop, ShadowBottom, ShadowContainer } = useScrollShadow(ref);

    const [end, setEnd] = useState(items.length);
    const onScrollEnd = useCallback(() => setEnd(end + 1000), [end]);
    const shadowColor = mapElevationToBackgroundToken({ $elevation: 0 });

    return (
        <ShadowContainer>
            <ShadowTop backgroundColor={shadowColor} />
            <VirtualizedList
                items={items}
                padding={8}
                ref={ref}
                onScroll={onScroll}
                renderItem={renderItem}
                onScrollEnd={onScrollEnd}
                listHeight={height}
                listMinHeight={minHeight}
                visibleItemsCount={20}
                beforeAfterBufferCount={30}
                loadMoreBufferCount={5}
                resetScrollOnItemsChange={false}
            />
            <ShadowBottom backgroundColor={shadowColor} />
        </ShadowContainer>
    );
}

export const AssetsList = memo(AssetsListInner) as typeof AssetsListInner;
