import { ReactNode } from 'react';
import styled, { DefaultTheme, css, useTheme } from 'styled-components';

import { Icon, IconType } from '../assets/Icon/Icon';
import { variables } from '../../config';
import {
    CSSColor,
    Color,
    Elevation,
    borders,
    mapElevationToBackgroundToken,
    spacingsPx,
    typography,
} from '@trezor/theme';
import { UIVariant } from '../../config/types';
import { useElevation } from '../..';

export type WarningVariant = Extract<
    UIVariant,
    'primary' | 'info' | 'warning' | 'destructive' | 'tertiary'
>;

export interface WarningProps {
    children: ReactNode;
    className?: string;
    variant?: WarningVariant;
    withIcon?: boolean;
    icon?: IconType;
    filled?: boolean;
}

type MapArgs = {
    $variant: WarningVariant;
    theme: DefaultTheme;
    $elevation: Elevation;
};

const mapVariantToBackgroundColor = ({ $variant, theme, $elevation }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        tertiary: mapElevationToBackgroundToken({ $elevation }),
    };

    return theme[colorMap[$variant]];
};

const mapVariantToTextColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'textPrimaryDefault',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
        tertiary: 'textSubdued',
    };

    return theme[colorMap[$variant]];
};
const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'iconPrimaryDefault',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        destructive: 'iconAlertRed',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

const mapVariantToIcon = ({ $variant }: Pick<MapArgs, '$variant'>): IconType => {
    const iconMap: Record<WarningVariant, IconType> = {
        primary: 'LIGHTBULB',
        info: 'INFO',
        warning: 'WARNING',
        destructive: 'WARNING',
        tertiary: 'INFO',
    };

    return iconMap[$variant];
};

type WrapperParams = {
    $variant: WarningVariant;
    $withIcon?: boolean;
    $elevation: Elevation;
    $filled: boolean;
};

const Wrapper = styled.div<WrapperParams>`
    align-items: center;
    ${({ $filled }) =>
        $filled
            ? css<WrapperParams>`
                  background: ${mapVariantToBackgroundColor};
                  border-radius: ${borders.radii.xs};
              `
            : ''}

    color: ${mapVariantToTextColor};
    display: flex;
    ${typography.hint}
    gap: ${spacingsPx.sm};
    justify-content: ${({ $withIcon }) => !$withIcon && 'center'};
    padding: ${spacingsPx.sm} ${spacingsPx.lg};
    width: 100%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: stretch;
        flex-direction: column;
        gap: ${spacingsPx.xs};
    }
`;

export const Warning = ({
    children,
    className,
    variant = 'warning',
    withIcon,
    icon,
    filled = true,
}: WarningProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    return (
        <Wrapper
            $variant={variant}
            $withIcon={withIcon}
            className={className}
            $elevation={elevation}
            $filled={filled}
        >
            {withIcon && (
                <Icon
                    size={20}
                    icon={icon === undefined ? mapVariantToIcon({ $variant: variant }) : icon}
                    color={mapVariantToIconColor({
                        $variant: variant,
                        theme,
                        $elevation: elevation,
                    })}
                />
            )}
            {children}
        </Wrapper>
    );
};
