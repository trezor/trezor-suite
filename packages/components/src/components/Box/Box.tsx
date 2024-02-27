import { ReactNode, HTMLAttributes } from 'react';
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
import { useElevation } from '../ElevationContext/ElevationContext';
import { ElevationContext } from '../ElevationContext/ElevationContext';
import { UIVariant } from '../../config/types';

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

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    variant?: BoxVariant;
    children: ReactNode;
}

const Wrapper = styled.div<{ variant?: BoxVariant; elevation: Elevation }>`
    display: flex;
    flex: 1;
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.md};
    background: ${mapElevationToBackground};
    border: solid 1px ${mapElevationToBorder};

    ${({ variant, theme }) =>
        variant === undefined
            ? `padding-left: ${spacingsPx.lg};`
            : `border-left: 6px solid ${mapVariantToBackgroundColor({ variant, theme })};`}
`;

export const Box = ({ variant, children, ...rest }: BoxProps) => {
    const { elevation } = useElevation();

    return (
        <Wrapper variant={variant} elevation={elevation} {...rest}>
            <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
        </Wrapper>
    );
};
