import React, { memo, useEffect, useMemo, useRef } from 'react';

import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import styled from 'styled-components';

import { type TimerId } from '@trezor/type-utils';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedVirtualizedListFrameProps: FramePropsKeys[] = ['padding'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedVirtualizedListFrameProps)[number]>;

function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: TimerId | null = null;

    return (...args: Parameters<T>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

type ContainerProps = TransientProps<AllowedFrameProps> & {
    $height: number | string;
    $minHeight: number | string;
};

const Container = styled.div<ContainerProps>`
    height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
    min-height: ${({ $minHeight }) =>
        typeof $minHeight === 'number' ? `${$minHeight}px` : $minHeight};

    width: 100%;
    overflow-y: auto;
    position: relative;
    ${withFrameProps};
`;
const Content = styled.div`
    position: relative;
    overflow: hidden;
    will-change: scroll-position;
`;
const Item = styled.div`
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
`;

export type BaseItemProps = {
    height: number;
};

const SCROLL_END_DEBOUNCE_MS = 1000;

export type VirtualizedListProps<T extends BaseItemProps> = AllowedFrameProps & {
    items: Array<T>;

    /**
     * Rendered inside the element sized to the whole list, which is what the scroll shadow
     * sentinels of `useScrollShadow` have to be positioned against.
     */
    scrollSentinels?: React.ReactNode;

    /**
     * Called while scrolling once rendering reaches `loadMoreBufferCount` items from the end.
     * Only needed by lists that page more items in.
     */
    onScrollEnd?: () => void;
    listHeight: number | string;
    listMinHeight: number | string;
    ref?: React.RefObject<HTMLDivElement | null>;
    renderItem: (item: T, virtualItem: VirtualItem) => React.ReactNode;

    /**
     * Items rendered above and below the visible window.
     *
     * @default 8
     */
    overscan?: number;

    /**
     * How close to the end of the list rendering has to get before `onScrollEnd` fires.
     *
     * @default 100
     */
    loadMoreBufferCount?: number;

    /**
     * @default true
     */
    resetScrollOnItemsChange?: boolean;
};

export function VirtualizedListComponent<T extends BaseItemProps>({
    items,
    scrollSentinels,
    onScrollEnd,
    listHeight,
    listMinHeight,
    renderItem,
    ref,

    overscan = 8,
    loadMoreBufferCount = 100,

    resetScrollOnItemsChange = true,
    ...rest
}: VirtualizedListProps<T>) {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const containerRef = ref ?? internalRef;

    const debouncedOnScrollEnd = useMemo(() => {
        if (!onScrollEnd) return undefined;

        return debounce(onScrollEnd, SCROLL_END_DEBOUNCE_MS);
    }, [onScrollEnd]);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => containerRef.current,
        // Item heights come from the caller, so no item ever needs to be measured.
        estimateSize: index => items[index]?.height ?? 0,
        overscan,
        // The virtualizer tracks the scroll offset itself and reports here whenever the rendered
        // window moves. Asking for items only while it is scrolling keeps a list short enough to
        // have its own end already rendered from asking for more of them forever.
        onChange: instance => {
            if (!instance.isScrolling) {
                return;
            }

            const lastRenderedIndex = instance.getVirtualIndexes().at(-1);

            if (
                lastRenderedIndex !== undefined &&
                lastRenderedIndex >= instance.options.count - loadMoreBufferCount
            ) {
                debouncedOnScrollEnd?.();
            }
        },
    });

    useEffect(() => {
        // The virtualizer caches item sizes and does not watch `estimateSize`, so it has to be
        // told to recalculate them whenever the items — and with them their heights — change.
        virtualizer.measure();

        if (resetScrollOnItemsChange && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [items, resetScrollOnItemsChange, virtualizer, containerRef]);

    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedVirtualizedListFrameProps,
    ) as TransientProps<AllowedFrameProps>;

    return (
        <Container
            ref={containerRef}
            $height={listHeight}
            $minHeight={listMinHeight}
            {...frameProps}
        >
            <Content style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {scrollSentinels}
                {virtualizer.getVirtualItems().map(virtualItem => {
                    const item = items[virtualItem.index];

                    if (!item) return null;

                    return (
                        <Item
                            key={virtualItem.key}
                            ref={virtualizer.measureElement}
                            data-index={virtualItem.index}
                            style={{
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(item, virtualItem)}
                        </Item>
                    );
                })}
            </Content>
        </Container>
    );
}

// NOTE: typecast here + memo() because of passing the ref for useShadow()
export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;
