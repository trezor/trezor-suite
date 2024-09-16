import { Elevation, mapElevationToBorder, SpacingValues } from '@trezor/theme';
import styled, { css, DefaultTheme } from 'styled-components';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';
import React from 'react';

export const allowedFlexFrameProps = [
    'margin',
    'width',
    'height',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedFlexFrameProps)[number]>;

export const flexDirection = ['column', 'row'] as const;
export const flexWrap = ['nowrap', 'wrap', 'wrap-reverse'] as const;

export const flexJustifyContent = [
    'center',
    'end',
    'flex-end',
    'flex-start',
    'left',
    'right',
    'space-around',
    'space-between',
    'space-evenly',
    'start',
    'stretch',
] as const;

export const flexAlignItems = [
    'baseline',
    'center',
    'end',
    'first baseline',
    'flex-end',
    'flex-start',
    'last baseline',
    'self-end',
    'self-start',
    'start',
    'stretch',
    'normal',
] as const;

export type FlexDirection = (typeof flexDirection)[number];
export type FlexJustifyContent = (typeof flexJustifyContent)[number];
export type FlexAlignItems = (typeof flexAlignItems)[number];
export type Flex =
    | 'none'
    | 'auto'
    | 'initial'
    | 'inherit'
    | `${number}`
    | `${number} ${number}`
    | `${number} ${number} ${string}`;
export type FlexWrap = (typeof flexWrap)[number];

export const withDivider = ({
    theme,
    $gap,
    $direction,
    $elevation,
    $dividerColor,
}: {
    theme: DefaultTheme;
    $gap: SpacingValues;
    $direction: FlexDirection;
    $dividerColor?: string;
    $elevation: Elevation;
}) => {
    return css`
        & > * {
            position: relative;
        }

        & > *:not(:first-child)::before {
            content: '';
            display: block;
            position: absolute;

            ${$direction === 'column' &&
            `
        top: -${$gap / 2}px;
        height: 1px;
        width: 100%;
        left: 0;
        border-top: 1px solid ${$dividerColor ? $dividerColor : mapElevationToBorder({ theme, $elevation })};`}
            ${$direction === 'row' &&
            `
        top: 0;
        height: 100%;
        width: 1px;
        left: -${$gap / 2}px;
        border-left: 1px solid ${$dividerColor ? $dividerColor : mapElevationToBorder({ theme, $elevation })};`}
        }
    `;
};

type ContainerProps = TransientProps<AllowedFrameProps> & {
    $gap: SpacingValues;
    $justifyContent: FlexJustifyContent;
    $alignItems: FlexAlignItems;
    $direction: FlexDirection;
    $flex: Flex;
    $flexWrap: FlexWrap;
    $isReversed: boolean;
    $hasDivider: boolean;
    $dividerColor?: string;
    $elevation: Elevation;
};

const Container = styled.div<ContainerProps>`
    display: flex;

    flex-flow: ${({ $direction, $isReversed, $flexWrap }) =>
        `${$direction}${$isReversed === true ? '-reverse' : ''} ${$flexWrap}`};
    flex: ${({ $flex }) => $flex};
    gap: ${({ $gap }) => $gap}px;
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $alignItems }) => $alignItems};

    ${({ $hasDivider, ...props }) => $hasDivider && withDivider(props)}
    ${withFrameProps}
`;

export type FlexProps = AllowedFrameProps & {
    gap?: SpacingValues;
    justifyContent?: FlexJustifyContent;
    alignItems?: FlexAlignItems;
    children: React.ReactNode;
    direction?: FlexDirection;
    flex?: Flex;
    flexWrap?: FlexWrap;
    isReversed?: boolean;
    hasDivider?: boolean;
    /** @deprecated Use only is case of absolute desperation. Prefer keep it according to elevation. */
    dividerColor?: string;
    className?: string;
    onClick?: () => void;
    'data-testid'?: string;
};

const Flex = ({
    gap = 0,
    justifyContent = 'flex-start',
    alignItems = 'center',
    children,
    direction = 'row',
    flex = 'initial',
    flexWrap = 'nowrap',
    isReversed = false,
    className,
    'data-testid': dataTestId,
    hasDivider = false,
    dividerColor,
    onClick,
    ...rest
}: FlexProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedFlexFrameProps);

    const { elevation } = useElevation();

    return (
        <Container
            className={className}
            data-testid={dataTestId}
            {...makePropsTransient({
                gap,
                justifyContent,
                alignItems,
                direction,
                flex,
                flexWrap,
                isReversed,
                hasDivider,
                dividerColor,
                elevation,
            })}
            onClick={onClick}
            {...frameProps}
        >
            {children}
        </Container>
    );
};

export const Column = (props: FlexProps) => <Flex {...props} direction="column" />;
export const Row = (props: FlexProps) => <Flex {...props} direction="row" />;
