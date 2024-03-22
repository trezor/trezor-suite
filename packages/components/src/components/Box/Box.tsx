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
import { ComponentFrame, FrameProps } from '../common/ComponentFrame';

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

export type BoxProps = FrameProps & {
    variant?: BoxVariant;
    children: ReactNode;
    forceElevation?: Elevation;
};

const Wrapper = styled.div<{ $variant?: BoxVariant; $elevation: Elevation }>`
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
`;

export const Box = ({ variant, children, margin, forceElevation, ...rest }: BoxProps) => {
    const { elevation } = useElevation(forceElevation);

    return (
        <ComponentFrame margin={margin}>
            <Wrapper $variant={variant} $elevation={elevation} {...rest}>
                <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
            </Wrapper>
        </ComponentFrame>
    );
};
