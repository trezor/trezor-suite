import { ReactNode } from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import { Icon, IconType } from '../assets/Icon/Icon';
import { variables } from '../../config';
import { CSSColor, Color, borders, spacingsPx, typography } from '@trezor/theme';
import { UIVariant } from '../../config/types';

export type WarningVariant = Extract<UIVariant, 'primary' | 'info' | 'warning' | 'destructive'>;

export interface WarningProps {
    children: ReactNode;
    className?: string;
    variant?: WarningVariant;
    withIcon?: boolean;
    icon?: IconType;
}

type MapArgs = {
    variant: WarningVariant;
    theme: DefaultTheme;
};

const mapVariantToBackgroundColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
    };

    return theme[colorMap[variant]];
};

const mapVariantToTextColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'textPrimaryDefault',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
    };

    return theme[colorMap[variant]];
};
const mapVariantToIconColor = ({ variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'iconPrimaryDefault',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        destructive: 'iconAlertRed',
    };

    return theme[colorMap[variant]];
};

const mapVariantToIcon = ({ variant }: Pick<MapArgs, 'variant'>): IconType => {
    const iconMap: Record<WarningVariant, IconType> = {
        primary: 'LIGHTBULB',
        info: 'INFO',
        warning: 'WARNING',
        destructive: 'WARNING',
    };

    return iconMap[variant];
};

const Wrapper = styled.div<{ variant: WarningVariant; withIcon?: boolean }>`
    align-items: center;
    background: ${mapVariantToBackgroundColor};
    border-radius: ${borders.radii.xs};
    color: ${mapVariantToTextColor};
    display: flex;
    ${typography.hint}
    gap: ${spacingsPx.sm};
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
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
}: WarningProps) => {
    const theme = useTheme();

    return (
        <Wrapper variant={variant} withIcon={withIcon} className={className}>
            {withIcon && (
                <Icon
                    size={20}
                    icon={icon === undefined ? mapVariantToIcon({ variant }) : icon}
                    color={mapVariantToIconColor({ variant, theme })}
                />
            )}
            {children}
        </Wrapper>
    );
};
