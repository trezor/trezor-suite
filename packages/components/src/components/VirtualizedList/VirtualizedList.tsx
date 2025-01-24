import React, { useState, useEffect, useCallback, useRef, memo, forwardRef, useMemo } from 'react';

import styled from 'styled-components';

import { isChanged } from '@suite-common/suite-utils';
import { TimerId } from '@trezor/type-utils';

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

const DEFAULT_VISIBLE_ITEMS_COUNT = 20;
const BEFORE_AFTER_BUFFER_COUNT = 100;
const LOAD_MORE_BUFFER_COUNT = 100;
const ESTIMATED_ITEM_HEIGHT = 40;

interface ContainerProps {
    $height: number | string;
    $minHeight: number | string;
}

const Container = styled.div<ContainerProps>`
    height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
    min-height: ${({ $minHeight }) =>
        typeof $minHeight === 'number' ? `${$minHeight}px` : $minHeight};

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

type BaseItemProps = {
    height: number;
};

const calculateItemHeight = <T extends BaseItemProps>(item: T): number => item.height;

interface ListContainerProps<T extends BaseItemProps> {
    listHeight: number | string;
    listMinHeight: number | string;
    totalHeight: number;
    items: Array<T>;
    itemHeights: Array<number>;
    startIndex: number;
    endIndex: number;
    ref?: React.Ref<HTMLDivElement>; // NOTE: needs to be here due to typecasting due to forwardRef
    renderItem: (item: T, index: number) => React.ReactNode;
}

function ListContainerComponent<T extends BaseItemProps>(
    {
        listHeight,
        listMinHeight,
        totalHeight,
        items,
        itemHeights,
        startIndex,
        endIndex,
        renderItem,
    }: ListContainerProps<T>,
    ref: React.Ref<HTMLDivElement>,
) {
    return (
        <Container ref={ref} $height={listHeight} $minHeight={listMinHeight}>
            <Content style={{ height: `${totalHeight}px` }}>
                {itemHeights.slice(startIndex, endIndex).map((height, index) => {
                    const itemIndex = startIndex + index;
                    const itemTop = itemHeights.slice(0, itemIndex).reduce((acc, h) => acc + h, 0);

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
}

// NOTE: don't forget the forwardRef() because of passing the ref for useShadow()
const ListContainer = memo(forwardRef(ListContainerComponent)) as typeof ListContainerComponent;

type VirtualizedListProps<T extends BaseItemProps> = {
    items: Array<T>;
    onScroll?: (e: Event) => void;
    onScrollEnd: () => void;
    listHeight: number | string;
    listMinHeight: number | string;
    ref?: React.Ref<HTMLDivElement>;
    renderItem: (item: T, index: number) => React.ReactNode;
};

export function VirtualizedListComponent<T extends BaseItemProps>(
    {
        items: initialItems,
        onScroll,
        onScrollEnd,
        listHeight,
        listMinHeight,
        renderItem,
    }: VirtualizedListProps<T>,
    ref: React.Ref<HTMLDivElement>,
) {
    const newRef = useRef<HTMLDivElement>(null);
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || newRef;
    const [items, setItems] = useState(initialItems);
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(DEFAULT_VISIBLE_ITEMS_COUNT);
    const debouncedOnScrollEnd = useMemo(() => debounce(onScrollEnd, 1000), [onScrollEnd]);

    const resetScroll = useCallback(() => {
        if (!containerRef.current) return;

        containerRef.current.scrollTop = 0;
    }, [containerRef]);

    useEffect(() => {
        if (isChanged(items, initialItems)) {
            setItems(initialItems);
            resetScroll();
        }
    }, [initialItems, items, resetScroll]);

    const itemHeights = useMemo(() => items.map(item => calculateItemHeight(item)), [items]);
    const totalHeight = useMemo(
        () => itemHeights.reduce((acc, height) => acc + height, 0),
        [itemHeights],
    );

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
        <ListContainer<T>
            ref={containerRef}
            listHeight={listHeight}
            listMinHeight={listMinHeight}
            totalHeight={totalHeight}
            items={items}
            itemHeights={itemHeights}
            startIndex={startIndex}
            endIndex={endIndex}
            renderItem={renderItem}
        />
    );
}

// NOTE: typecast here + memo() and forwardRef() because of passing the ref for useShadow()
export const VirtualizedList = memo(
    forwardRef(VirtualizedListComponent),
) as typeof VirtualizedListComponent;
