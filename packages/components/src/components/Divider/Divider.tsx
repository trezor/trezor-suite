import styled from 'styled-components';
import { Color, Elevation, mapElevationToBorder, spacings } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';
import { FrameProps, withFrameProps } from '../common/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedDividerFrameProps: (keyof FrameProps)[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDividerFrameProps)[number]>;
type DividerOrientation = 'horizontal' | 'vertical';

type DividerProps = AllowedFrameProps & {
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
            ? `
                height: 100%;
                width: ${$strokeWidth}px;
                min-width: ${$strokeWidth}px;`
            : `
                width: 100%;
                height: ${$strokeWidth}px;
                min-height: ${$strokeWidth}px;
    `}

    background: ${({ theme, $elevation, $color }) =>
        $color ? theme[$color] : mapElevationToBorder({ theme, $elevation })};

    ${withFrameProps}
`;

export const Divider = ({
    margin = { top: spacings.md, bottom: spacings.md },
    strokeWidth = 1,
    color,
    orientation = 'horizontal',
}: DividerProps) => {
    const { elevation } = useElevation();

    return (
        <Line
            $elevation={elevation}
            $margin={margin}
            $color={color}
            $strokeWidth={strokeWidth}
            $orientation={orientation}
        />
    );
};
