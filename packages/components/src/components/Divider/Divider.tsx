import styled, { css } from 'styled-components';

import { Color, Elevation, mapElevationToBorder, spacings } from '@trezor/theme';

import { useElevation } from '../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

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

export const Divider = ({
    strokeWidth = 1,
    color,
    orientation = 'horizontal',
    ...rest
}: DividerProps) => {
    const { elevation } = useElevation();

    const frameProps = pickAndPrepareFrameProps(
        { ...rest, margin: rest.margin ?? { top: spacings.md, bottom: spacings.md } },
        allowedDividerFrameProps,
    );

    return (
        <Line
            $elevation={elevation}
            $color={color}
            $strokeWidth={strokeWidth}
            $orientation={orientation}
            {...frameProps}
        />
    );
};
