import { type RefObject, memo, useMemo } from 'react';

import {
    type BaseItemProps,
    VirtualizedList,
    type VirtualizedListProps,
    useScrollShadow,
} from '@trezor/components';

export interface AssetsListProps<T extends BaseItemProps> {
    items: T[];
    renderItem: VirtualizedListProps<T>['renderItem'];
    height: VirtualizedListProps<T>['listHeight'];
    minHeight?: VirtualizedListProps<T>['listMinHeight'];
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
    const { scrollElementRef, ScrollSentinels, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow({
            externalRef: ref,
            backgroundColor: 'surfaceFillModal',
        });

    // Kept referentially stable so that the shadows switching on and off cannot re-render the
    // list itself.
    const scrollSentinels = useMemo(() => <ScrollSentinels />, [ScrollSentinels]);

    return (
        <ShadowContainer>
            <ShadowTop />
            <VirtualizedList
                items={items}
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
