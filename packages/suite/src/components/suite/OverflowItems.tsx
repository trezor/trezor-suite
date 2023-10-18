import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { usePrevious } from 'react-use';
import { useSelector } from 'src/hooks/suite';
import styled from 'styled-components';

export type OverflowItem = {
    removeOrder?: number;
    [key: string]: any;
};

const Wrapper = styled.div`
    display: flex;
    flex-wrap: nowrap;
    min-width: 0;
`;

interface OverflowItemsProps<T> {
    className?: string;
    items: T[];
    visibleItemRenderer: (item: T, index: number) => ReactNode;
    overflowRenderer: (items: T[]) => ReactNode;
    minVisibleItems?: number;
    alwaysRenderOverflow?: boolean;
}

export function OverflowItems<T extends OverflowItem>({
    items,
    className,
    minVisibleItems = 0,
    alwaysRenderOverflow,
    visibleItemRenderer,
    overflowRenderer,
}: OverflowItemsProps<T>) {
    const screenWidth = useSelector(state => state.resize.screenWidth) ?? 0;
    const previousWidth = usePrevious(screenWidth);

    const [state, setState] = useState({
        visibleItems: items,
        overflowItems: [] as T[],
    });

    const wrapperRef = useRef(null);

    const showAllItems = useCallback(
        () =>
            setState({
                overflowItems: [],
                visibleItems: items,
            }),
        [items],
    );

    const repartition = useCallback(() => {
        if (!wrapperRef.current) {
            return;
        }

        const wrapper = wrapperRef.current as Element;

        if (!wrapper) {
            return;
        }

        if (
            Math.floor(wrapper.scrollWidth - 1) > Math.floor(wrapper.getBoundingClientRect().width)
        ) {
            const getNewState = (prevState: typeof state) => {
                if (prevState.visibleItems.length <= minVisibleItems!) {
                    return prevState;
                }

                const nextItem = prevState.visibleItems
                    .slice()
                    .sort((item1, item2) => (item1.removeOrder ?? 0) - (item2.removeOrder ?? 0))[0];

                if (!nextItem) {
                    return prevState;
                }

                const visible = prevState.visibleItems.slice();
                visible.splice(
                    prevState.visibleItems.findIndex(
                        item => item.removeOrder === nextItem.removeOrder,
                    ),
                    1,
                );

                return {
                    overflowItems: [nextItem, ...prevState.overflowItems],
                    visibleItems: visible,
                };
            };

            setState(getNewState);
        }
    }, [minVisibleItems]);

    useEffect(() => {
        if (!previousWidth || screenWidth > previousWidth) {
            showAllItems();
            return;
        }

        repartition();
    }, [screenWidth, previousWidth, repartition, showAllItems, items, state]);

    return (
        <Wrapper ref={wrapperRef} className={className}>
            {state.visibleItems.map(visibleItemRenderer)}
            {(state.overflowItems.length !== 0 || alwaysRenderOverflow) &&
                overflowRenderer(state.overflowItems)}
        </Wrapper>
    );
}
