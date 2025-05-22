import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Row, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, spacings } from '@trezor/theme';

import { TabsContext } from './TabsContext';
import { TabsItem } from './TabsItem';
import { TabsSize } from './types';
import { TRANSFORM_OPTIONS, mapSizeToContainerPaddingBottom } from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedTabsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTabsFrameProps)[number]>;

type ContainerProps = TransientProps<AllowedFrameProps> & {
    $hasBorder?: boolean;
    $elevation: Elevation;
    $indicatorWidth: number;
    $size: TabsSize;
    $indicatorPosition: number;
};

const Container = styled.div<ContainerProps>`
    width: 100%;
    padding-bottom: ${mapSizeToContainerPaddingBottom};
    border-bottom: ${borders.widths.small} solid ${mapElevationToBorder};
    position: relative;

    ${({ $hasBorder }) => !$hasBorder && `border-bottom: 0;`}

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 1px;
        height: ${borders.widths.large};
        background: ${({ theme }) => theme.iconDefault};
        transform: ${({ $indicatorWidth, $indicatorPosition }) =>
            `translateX(${$indicatorPosition}px) scaleX(${$indicatorWidth})`};
        transform-origin: left;
        transition: transform ${TRANSFORM_OPTIONS};
    }

    ${withFrameProps}
`;

export type TabsProps = AllowedFrameProps & {
    children: ReactNode;
    activeItemId?: string;
    isDisabled?: boolean;
    hasBorder?: boolean;
    size?: TabsSize;
};

const Tabs = ({
    isDisabled = false,
    hasBorder = true,
    size = 'medium',
    activeItemId,
    children,
    ...rest
}: TabsProps) => {
    const { elevation } = useElevation();
    const [indicatorWidth, setIndicatorWidth] = useState(0);
    const [indicatorPosition, setIndicatorPosition] = useState(0);
    const tabsRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const frameProps = pickAndPrepareFrameProps(rest, allowedTabsFrameProps);

    const setTabRef = useCallback(
        (id: string) => (el: HTMLDivElement) => {
            tabsRefs.current.set(id, el);
        },
        [],
    );

    const updateIndicator = useCallback(() => {
        if (!activeItemId) return;

        const activeItemEl = tabsRefs.current.get(activeItemId);
        const width = activeItemEl?.getBoundingClientRect()?.width;
        const position = activeItemEl?.offsetLeft;

        setIndicatorWidth(width ?? 0);
        setIndicatorPosition(position ?? 0);
    }, [activeItemId]);

    useEffect(() => {
        updateIndicator();

        if (!containerRef.current) return undefined;

        const observer = new ResizeObserver(() => {
            updateIndicator();
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [updateIndicator]);

    return (
        <TabsContext.Provider value={{ activeItemId, isDisabled, size, setTabRef }}>
            <Container
                ref={containerRef}
                $hasBorder={hasBorder}
                $elevation={elevation}
                $indicatorWidth={indicatorWidth}
                $indicatorPosition={indicatorPosition}
                $size={size}
                {...frameProps}
            >
                <Row alignItems="stretch" gap={spacings.sm}>
                    {children}
                </Row>
            </Container>
        </TabsContext.Provider>
    );
};

Tabs.Item = TabsItem;

export { Tabs };
