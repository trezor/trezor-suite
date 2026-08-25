import { type RefObject, memo, useMemo } from 'react';

import {
    type BaseItemProps,
    VirtualizedList,
    type VirtualizedListProps,
    useScrollShadow,
} from '@trezor/components';

type MeasuredItem<T> = T & BaseItemProps;

export interface AssetsListProps<T> {
    items: T[];
    renderItem: VirtualizedListProps<MeasuredItem<T>>['renderItem'];
    getItemHeight: (item: T) => number;
    height: VirtualizedListProps<MeasuredItem<T>>['listHeight'];
    minHeight?: VirtualizedListProps<MeasuredItem<T>>['listMinHeight'];
    ref?: RefObject<HTMLDivElement | null>;
}

export const LIST_MIN_HEIGHT = 200;

function AssetsListInner<T>({
    items,
    renderItem,
    getItemHeight,
    height,
    minHeight = LIST_MIN_HEIGHT,
    ref,
}: AssetsListProps<T>) {
    const { scrollElementRef, ScrollSentinels, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow({
            externalRef: ref,
            backgroundColor: 'surfaceFillModal',
        });

    // Kept referentially stable so that the shadows switching on and off cannot re-render the
    // list itself.
    const scrollSentinels = useMemo(() => <ScrollSentinels />, [ScrollSentinels]);

    const measuredItems = useMemo(
        () => items.map(item => ({ ...item, height: getItemHeight(item) })),
        [items, getItemHeight],
    );

    return (
        <ShadowContainer>
            <ShadowTop />
            <VirtualizedList
                items={measuredItems}
                padding={8}
                ref={scrollElementRef}
                scrollSentinels={scrollSentinels}
                renderItem={renderItem}
                listHeight={height}
                listMinHeight={minHeight}
                resetScrollOnItemsChange={false}
            />
            <ShadowBottom />
        </ShadowContainer>
    );
}

export const AssetsList = memo(AssetsListInner) as typeof AssetsListInner;
