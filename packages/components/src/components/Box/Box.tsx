import { ReactNode } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import {
    CSSColor,
    Color,
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import { UIVariant } from '../../config/types';
import { FrameProps, withFrameProps } from '../common/frameProps';
import { TransientProps, makePropsTransient } from '../../utils/transientProps';

type BoxVariant = Extract<UIVariant, 'primary' | 'warning' | 'destructive' | 'info'>;

type MapArgs = {
    variant: BoxVariant;
    theme: DefaultTheme;
};

const mapVariantToBackgroundColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BoxVariant, Color> = {
        primary: 'borderSecondary',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'borderAlertRed',
    };

    return theme[colorMap[variant]];
};

export const allowedFrameProps: (keyof FrameProps)[] = ['margin', 'maxWidth'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedFrameProps)[number]>;

export type BoxProps = AllowedFrameProps & {
    variant?: BoxVariant;
    children: ReactNode;
    forceElevation?: Elevation;
};

const Wrapper = styled.div<
    { $variant?: BoxVariant; $elevation: Elevation } & TransientProps<AllowedFrameProps>
>`
    display: flex;
    align-items: center;
    flex: 1;
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.md};
    background: ${mapElevationToBackground};
    border: solid 1px ${mapElevationToBorder};

    ${({ $variant, theme }) =>
        $variant === undefined
            ? `padding-left: ${spacingsPx.lg};`
            : `border-left: 6px solid ${mapVariantToBackgroundColor({ variant: $variant, theme })};`}

    ${withFrameProps}
`;

export const Box = ({ variant, children, margin, maxWidth, forceElevation, ...rest }: BoxProps) => {
    const { elevation } = useElevation(forceElevation);

    const frameProps = {
        margin,
        maxWidth,
    };

    return (
        <Wrapper
            $variant={variant}
            $elevation={elevation}
            {...rest}
            {...makePropsTransient(frameProps)}
        >
            <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
        </Wrapper>
    );
};
