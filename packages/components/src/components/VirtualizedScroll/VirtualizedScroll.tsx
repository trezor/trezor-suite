import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

function debounce<T extends (...args: any[]) => void>(
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
const ESTIMATED_ITEM_HEIGHT = 20;

const Container = styled.div`
    height: 500px;
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

const calculateItemHeight = (item: any) => {
    return item.height;
};

type VirtualizedScrollProps = { initialItems: any[]; onScrollEnd: () => void };

export const VirtualizedScroll = ({ initialItems, onScrollEnd }: VirtualizedScrollProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
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

    const onScroll = useCallback(() => {
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
            visibleHeight < containerHeight + BEFORE_AFTER_BUFFER_COUNT * ESTIMATED_ITEM_HEIGHT
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
    }, [debouncedOnScrollEnd, itemHeights, items.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', onScroll);

            return () => container.removeEventListener('scroll', onScroll);
        }
    }, [onScroll]);

    return (
        <Container ref={containerRef}>
            <Content style={{ height: `${totalHeight}px` }}>
                {itemHeights.slice(startIndex, endIndex).map((height, index) => {
                    const itemIndex = startIndex + index;
                    const itemTop = itemHeights.slice(0, itemIndex).reduce((acc, h) => acc + h, 0);

                    return (
                        <Item
                            key={itemIndex}
                            style={{
                                top: `${itemTop}px`,
                                height,
                            }}
                        >
                            {items[itemIndex].content}
                        </Item>
                    );
                })}
            </Content>
        </Container>
    );
};
