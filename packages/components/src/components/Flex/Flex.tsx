import React, { HTMLAttributes } from 'react';

import styled, { DefaultTheme, css } from 'styled-components';

import {
    Color,
    Elevation,
    SpacingValues,
    SpacingValuesNew,
    mapElevationToBorder,
} from '@trezor/theme';

import {
    FlexAlignItems,
    FlexAlignSelf,
    FlexDirection,
    FlexJustifyContent,
    FlexType,
    FlexWrap,
} from './FlexProp';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps, makePropsTransient } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';

export const allowedFlexFrameProps = [
    'margin',
    'padding',
    'width',
    'height',
    'minHeight',
    'maxHeight',
    'minWidth',
    'maxWidth',
    'overflow',
    'cursor',
    'display',
    'opacity',
    'position',
    'pointerEvents',
    'zIndex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedFlexFrameProps)[number]>;

export const withDivider = ({
    theme,
    $rowGap,
    $columnGap,
    $direction,
    $elevation,
    $dividerColor,
}: {
    theme: DefaultTheme;
    $rowGap: SpacingValues | SpacingValuesNew;
    $columnGap: SpacingValues | SpacingValuesNew;
    $direction: FlexDirection;
    $dividerColor?: Color;
    $elevation: Elevation;
}) => css`
    & > * {
        position: relative;
    }

    & > *:not(:first-child)::before {
        content: '';
        display: block;
        position: absolute;

        ${$direction === 'column' &&
        `
        top: -${$rowGap / 2}px;
        height: 1px;
        width: 100%;
        left: 0;
        border-top: 1px solid ${$dividerColor ? theme[$dividerColor] : mapElevationToBorder({ theme, $elevation })};`}
        ${$direction === 'row' &&
        `
        top: 0;
        height: 100%;
        width: 1px;
        left: -${$columnGap / 2}px;
        border-left: 1px solid ${$dividerColor ? theme[$dividerColor] : mapElevationToBorder({ theme, $elevation })};`}
    }
`;

type ContainerProps = TransientProps<AllowedFrameProps> & {
    $rowGap: SpacingValues | SpacingValuesNew;
    $columnGap: SpacingValues | SpacingValuesNew;
    $justifyContent: FlexJustifyContent;
    $alignItems: FlexAlignItems;
    $alignSelf: FlexAlignSelf;
    $direction: FlexDirection;
    $flex: FlexType;
    $flexWrap: FlexWrap;
    $order?: number;
    $isReversed: boolean;
    $hasDivider: boolean;
    $dividerColor?: Color;
    $elevation: Elevation;
};

const Container = styled.div<ContainerProps>`
    display: flex;

    flex-flow: ${({ $direction, $isReversed, $flexWrap }) =>
        `${$direction}${$isReversed === true ? '-reverse' : ''} ${$flexWrap}`};
    flex: ${({ $flex }) => $flex};
    gap: ${({ $rowGap, $columnGap }) => `${$rowGap}px ${$columnGap}px`};
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $alignItems }) => $alignItems};
    align-self: ${({ $alignSelf }) => $alignSelf};
    ${({ $order }) => (typeof $order !== 'undefined' ? `order: ${$order};` : '')}

    ${({ $hasDivider, ...props }) => $hasDivider && withDivider(props)}
    ${withFrameProps}

    &:empty {
        display: none;
    }
`;

export type FlexProps = AllowedFrameProps &
    Pick<HTMLAttributes<HTMLElement>, 'onClick' | 'onMouseEnter' | 'onMouseLeave'> & {
        gap?: SpacingValues | SpacingValuesNew;
        rowGap?: SpacingValues | SpacingValuesNew;
        columnGap?: SpacingValues | SpacingValuesNew;
        /**
         * Distributes space between and around content items along the **main** axis
         */
        justifyContent?: FlexJustifyContent;
        /**
         * Controls the alignment of items on the **cross** axis
         */
        alignItems?: FlexAlignItems;
        alignSelf?: FlexAlignSelf;
        children: React.ReactNode;
        direction?: FlexDirection;
        flex?: FlexType;
        flexWrap?: FlexWrap;
        order?: number;
        isReversed?: boolean;
        hasDivider?: boolean;
        dividerColor?: Color;
        className?: string;
        'data-testid'?: string;
        as?: string;
        ref?: React.RefObject<HTMLElement | null>;
    };

export const Flex = ({
    gap = 0,
    rowGap = gap,
    columnGap = gap,
    justifyContent = 'flex-start',
    alignItems = 'normal',
    alignSelf = 'auto',
    children,
    direction = 'row',
    flex = 'initial',
    flexWrap = 'nowrap',
    order,
    isReversed = false,
    className,
    'data-testid': dataTestId,
    as = 'div',
    hasDivider = false,
    dividerColor,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ref,
    ...rest
}: FlexProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedFlexFrameProps);

    const { elevation } = useElevation();

    return (
        <Container
            className={className}
            data-testid={dataTestId}
            {...makePropsTransient({
                rowGap,
                columnGap,
                justifyContent,
                alignItems,
                alignSelf,
                direction,
                flex,
                flexWrap,
                order,
                isReversed,
                hasDivider,
                dividerColor,
                elevation,
            })}
            onClick={onClick}
            as={as}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={ref as React.Ref<HTMLDivElement>}
            {...frameProps}
        >
            {children}
        </Container>
    );
};

export const Column = (props: FlexProps) => <Flex {...props} direction="column" />;
export const Row = (props: FlexProps) => <Flex alignItems="center" {...props} direction="row" />;
export const Center = (props: FlexProps) => (
    <Flex
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        width="100%"
        height="100%"
        {...props}
    />
);
