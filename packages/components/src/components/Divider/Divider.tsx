import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Color, Elevation, SpacingValues, mapElevationToBorder, spacings } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';
import { Column, Row } from '../Flex/Flex';

export const allowedDividerFrameProps = [
    'margin',
    'width',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDividerFrameProps)[number]>;
type DividerOrientation = 'horizontal' | 'vertical';

export type DividerProps = AllowedFrameProps & {
    orientation?: DividerOrientation;
    strokeWidth?: number;
    color?: Color;
    children?: ReactNode;
    contentPosition?: 'start' | 'center' | 'end'; // TODO: unify with uiAlignments in the future"
    gap?: SpacingValues;
};

const Line = styled.div<
    {
        $elevation: Elevation;
        $strokeWidth: DividerProps['strokeWidth'];
        $color: DividerProps['color'];
        $orientation: DividerOrientation;
    } & TransientProps<AllowedFrameProps>
>`
    ${({ $orientation, $strokeWidth }) =>
        $orientation === 'vertical'
            ? css`
                  height: 100%;
                  width: ${$strokeWidth}px;
                  min-width: ${$strokeWidth}px;
              `
            : css`
                  width: 100%;
                  height: ${$strokeWidth}px;
                  min-height: ${$strokeWidth}px;
              `}

    background: ${({ theme, $elevation, $color }) =>
        $color ? theme[$color] : mapElevationToBorder({ theme, $elevation })};

    ${withFrameProps}
`;

type DividerContentProps = {
    line: ReactNode;
    children?: ReactNode;
    contentPosition?: 'start' | 'center' | 'end'; // TODO: unify with uiAlignments in the future"
};

const DividerContent = ({ line, children, contentPosition }: DividerContentProps) => {
    if (contentPosition === 'start') {
        return (
            <>
                {children} {line}
            </>
        );
    }

    if (contentPosition === 'center') {
        return (
            <>
                {line}
                {children}
                {line}
            </>
        );
    }

    return (
        <>
            {line}
            {children}
        </>
    );
};

export const Divider = ({
    strokeWidth = 1,
    color,
    orientation = 'horizontal',
    children,
    contentPosition = 'center',
    gap = spacings.xxl,
    ...rest
}: DividerProps) => {
    const { elevation } = useElevation();

    const frameProps: AllowedFrameProps = {
        ...rest,
        margin: rest.margin ?? { top: spacings.md, bottom: spacings.md },
    };

    const framePropsTransient = pickAndPrepareFrameProps(frameProps, allowedDividerFrameProps);

    const line = (
        <Line
            $elevation={elevation}
            $color={color}
            $strokeWidth={strokeWidth}
            $orientation={orientation}
            {...(children === undefined ? framePropsTransient : {})}
        />
    );

    if (children === undefined) {
        return line;
    }

    const content = (
        <DividerContent line={line} contentPosition={contentPosition}>
            {children}
        </DividerContent>
    );

    return orientation === 'horizontal' ? (
        <Row gap={gap} width="100%" alignItems="center" {...frameProps}>
            {content}
        </Row>
    ) : (
        <Column
            gap={gap}
            height="100%"
            alignItems="center"
            justifyContent="space-evenly"
            {...frameProps}
        >
            {content}
        </Column>
    );
};
