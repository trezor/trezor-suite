import React, { useState, useEffect, useCallback, forwardRef, useRef } from 'react';
import styled from 'styled-components';

function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

const DEFAULT_VISIBLE_ITEMS_COUNT = 20;
const BEFORE_AFTER_BUFFER_COUNT = 100;
const LOAD_MORE_BUFFER_COUNT = 100;
const ESTIMATED_ITEM_HEIGHT = 40;

const Container = styled.div<{ $height: number | string }>`
    height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
    width: 100%;
    overflow-y: auto;
    position: relative;
`;
const Content = styled.div`
    position: relative;
`;
const Item = styled.div`
    position: absolute;
    width: 100%;
`;

const calculateItemHeight = <T extends { height: number }>(item: T): number => {
    return item.height;
};

type VirtualizedListProps<T> = {
    items: Array<T & { height: number }>;
    onScroll?: (e: Event) => void;
    onScrollEnd: () => void;
    height: number | string;
    renderItem: (item: T, index: number) => React.ReactNode;
};

export const VirtualizedList = forwardRef<HTMLDivElement, VirtualizedListProps<any>>(
    <T,>(
        { items: initialItems, onScroll, onScrollEnd, height, renderItem }: VirtualizedListProps<T>,
        ref: React.Ref<HTMLDivElement>,
    ) => {
        const newRef = useRef<HTMLDivElement>(null);
        const containerRef = (ref as React.RefObject<HTMLDivElement>) || newRef;
        const [items, setItems] = useState(initialItems);
        const [startIndex, setStartIndex] = useState(0);
        const [endIndex, setEndIndex] = useState(DEFAULT_VISIBLE_ITEMS_COUNT);
        const [itemHeights, setItemHeights] = useState<number[]>([]);
        const [totalHeight, setTotalHeight] = useState(0);
        const debouncedOnScrollEnd = debounce(onScrollEnd, 1000);

        useEffect(() => {
            setItems(initialItems);
        }, [initialItems]);
        useEffect(() => {
            const heights = items.map(item => calculateItemHeight(item));
            setItemHeights(heights);
            setTotalHeight(heights.reduce((acc, height) => acc + height, 0));
        }, [items]);

        const handleScroll = useCallback(
            (e: Event) => {
                if (!containerRef.current) return;
                const { scrollTop } = containerRef.current;
                let offset = 0;
                let newStartIndex = 0;

                for (let i = 0; i < itemHeights.length; i++) {
                    if (offset + itemHeights[i] >= scrollTop) {
                        newStartIndex = i;
                        break;
                    }
                    offset += itemHeights[i];
                }

                newStartIndex = Math.max(0, newStartIndex - BEFORE_AFTER_BUFFER_COUNT);

                let newEndIndex = newStartIndex;
                let visibleHeight = 0;
                const containerHeight = containerRef.current.clientHeight;

                while (
                    newEndIndex < items.length &&
                    visibleHeight <
                        containerHeight + BEFORE_AFTER_BUFFER_COUNT * ESTIMATED_ITEM_HEIGHT
                ) {
                    visibleHeight += itemHeights[newEndIndex];
                    newEndIndex++;
                }
                newEndIndex = Math.min(items.length, newEndIndex + BEFORE_AFTER_BUFFER_COUNT);

                setStartIndex(newStartIndex);
                setEndIndex(newEndIndex);

                if (newEndIndex >= items.length - LOAD_MORE_BUFFER_COUNT) {
                    debouncedOnScrollEnd();
                }
                onScroll?.(e);
            },
            [containerRef, debouncedOnScrollEnd, itemHeights, items.length, onScroll],
        );

        useEffect(() => {
            const container = containerRef.current;
            if (container) {
                container.addEventListener('scroll', handleScroll);

                return () => container.removeEventListener('scroll', handleScroll);
            }
        }, [containerRef, handleScroll]);

        return (
            <Container ref={containerRef} $height={height}>
                <Content style={{ height: `${totalHeight}px` }}>
                    {itemHeights.slice(startIndex, endIndex).map((height, index) => {
                        const itemIndex = startIndex + index;
                        const itemTop = itemHeights
                            .slice(0, itemIndex)
                            .reduce((acc, h) => acc + h, 0);

                        if (!items[itemIndex]) return null;

                        return (
                            <Item
                                key={itemIndex}
                                style={{
                                    top: `${itemTop}px`,
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
    },
);
