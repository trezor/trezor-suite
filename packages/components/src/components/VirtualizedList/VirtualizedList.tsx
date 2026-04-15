import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    will-change: contents;
`;
const Item = styled.div`
    position: absolute;
    width: 100%;
    left: 0;
`;

export type BaseItemProps = {
    height: number;
};

const calculateItemHeight = <T extends BaseItemProps>(item: T): number => item.height;

type VirtualizedListProps<T extends BaseItemProps> = AllowedFrameProps & {
    items: Array<T>;
    onScroll?: (e: Event) => void;
    onScrollEnd: () => void;
    listHeight: number | string;
    listMinHeight: number | string;
    ref?: React.Ref<HTMLDivElement>;
    renderItem: (item: T, index: number) => React.ReactNode;

    /**
     * @default 20
     */
    visibleItemsCount?: number;

    /**
     * @default 100
     */
    beforeAfterBufferCount?: number;

    /**
     * @default 100
     */
    loadMoreBufferCount?: number;

    /**
     * @default 40
     */
    estimatedItemHeight?: number;

    /**
     * @default true
     */
    resetScrollOnItemsChange?: boolean;
};

export function VirtualizedListComponent<T extends BaseItemProps>({
    items: initialItems,
    onScroll,
    onScrollEnd,
    listHeight,
    listMinHeight,
    renderItem,
    ref,

    visibleItemsCount = 20,
    beforeAfterBufferCount = 100,
    loadMoreBufferCount = 100,
    estimatedItemHeight = 40,

    resetScrollOnItemsChange = true,
    ...rest
}: VirtualizedListProps<T>) {
    const newRef = useRef<HTMLDivElement>(null);
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || newRef;
    const [items, setItems] = useState(initialItems);
    const [indexes, setIndexes] = useState({
        startIndex: 0,
        endIndex: visibleItemsCount,
    });
    const debouncedOnScrollEnd = useMemo(() => debounce(onScrollEnd, 1000), [onScrollEnd]);

    const resetScroll = useCallback(() => {
        if (!containerRef.current) return;

        containerRef.current.scrollTop = 0;
    }, [containerRef]);

    useEffect(() => {
        setItems(initialItems);

        if (resetScrollOnItemsChange) {
            resetScroll();
        }
    }, [initialItems, resetScroll, resetScrollOnItemsChange]);

    const itemHeights = useMemo(() => items.map(item => calculateItemHeight(item)), [items]);
    const totalHeight = useMemo(
        () => itemHeights.reduce((acc, height) => acc + height, 0),
        [itemHeights],
    );

    // TODO: use https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API, it's more efficient
    const handleScroll = useCallback(
        (e: Event) => {
            if (!containerRef.current) return;
            const { scrollTop, clientHeight } = containerRef.current;
            let offset = 0;
            let newStartIndex = 0;

            for (let i = 0; i < itemHeights.length; i++) {
                if (offset + (itemHeights[i] ?? 0) >= scrollTop) {
                    newStartIndex = i;
                    break;
                }
                offset += itemHeights[i] ?? 0;
            }

            newStartIndex = Math.max(0, newStartIndex - beforeAfterBufferCount);

            let newEndIndex = newStartIndex;
            let visibleHeight = 0;
            const containerHeight = clientHeight;

            while (
                newEndIndex < items.length &&
                visibleHeight < containerHeight + beforeAfterBufferCount * estimatedItemHeight
            ) {
                visibleHeight += itemHeights[newEndIndex] ?? 0;
                newEndIndex++;
            }
            newEndIndex = Math.min(items.length, newEndIndex + beforeAfterBufferCount);

            setIndexes({
                startIndex: newStartIndex,
                endIndex: newEndIndex,
            });

            if (newEndIndex >= items.length - loadMoreBufferCount) {
                debouncedOnScrollEnd();
            }
            onScroll?.(e);
        },
        [
            beforeAfterBufferCount,
            containerRef,
            debouncedOnScrollEnd,
            estimatedItemHeight,
            itemHeights,
            items.length,
            loadMoreBufferCount,
            onScroll,
        ],
    );

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });

            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [containerRef, handleScroll]);

    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedVirtualizedListFrameProps,
    ) as TransientProps<AllowedFrameProps>;

    const firstItemTop = useMemo(
        () => itemHeights.slice(0, indexes.startIndex).reduce((acc, h) => acc + h, 0),
        [itemHeights, indexes.startIndex],
    );

    return (
        <Container ref={ref} $height={listHeight} $minHeight={listMinHeight} {...frameProps}>
            <Content style={{ height: `${totalHeight}px` }}>
                {/* TODO: use https://react-window.vercel.app/list/variable-row-height or something that's already optimized */}
                {itemHeights.slice(indexes.startIndex, indexes.endIndex).map((height, index) => {
                    const itemIndex = indexes.startIndex + index;

                    if (!items[itemIndex]) return null;

                    const itemTop =
                        firstItemTop +
                        itemHeights
                            .slice(indexes.startIndex, itemIndex)
                            .reduce((acc, h) => acc + h, 0);

                    return (
                        <Item
                            key={itemIndex}
                            style={{
                                transform: `translateY(${itemTop}px)`,
                                height,
                            }}
                        >
                            {renderItem(items[itemIndex], itemIndex)}
                        </Item>
                    );
                })}
            </Content>
        </Container>
    );
}

// NOTE: typecast here + memo() because of passing the ref for useShadow()
export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;
