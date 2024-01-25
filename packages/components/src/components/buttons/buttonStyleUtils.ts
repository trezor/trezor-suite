import { css, DefaultTheme } from 'styled-components';
import {
    BackgroundTertiaryElevationColor,
    Elevation,
    spacings,
    spacingsPx,
    nextElevation,
} from '@trezor/theme';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'info'
    | 'warning'
    | 'destructive';
export type ButtonSize = 'large' | 'medium' | 'small' | 'tiny';
export type IconAlignment = 'left' | 'right';

export const mapElevationToBackgroundTertiary: Record<Elevation, BackgroundTertiaryElevationColor> =
    {
        '-1': 'backgroundTertiaryElevationNegative', // For example left menu is negative elevation
        0: 'backgroundTertiaryDefaultOnElevation0',
        1: 'backgroundTertiaryDefaultOnElevation1',
        2: 'backgroundTertiaryDefaultOnElevation2',
        3: 'backgroundTertiaryDefaultOnElevation3',
    };

export const getPadding = (size: ButtonSize, hasLabel?: boolean) => {
    switch (size) {
        case 'large':
            return hasLabel ? `${spacingsPx.md} ${spacingsPx.xl}` : `${spacingsPx.md}`;
        case 'medium':
            return hasLabel ? `${spacingsPx.sm} ${spacingsPx.lg}` : '14px';
        case 'small':
            return hasLabel ? `${spacingsPx.xs} ${spacingsPx.md}` : '10px';
        case 'tiny':
            return hasLabel ? `${spacingsPx.xxxs} ${spacingsPx.xs}` : '6px';

        default:
            break;
    }
};

export const getIconColor = (variant: ButtonVariant, isDisabled: boolean, theme: DefaultTheme) => {
    if (isDisabled) {
        return theme.iconDisabled;
    }

    switch (variant) {
        case 'primary':
            return theme.iconOnPrimary;
        case 'secondary':
            return theme.iconOnSecondary;
        case 'tertiary':
            return theme.iconOnTertiary;
        case 'info':
            return theme.iconAlertBlue;
        case 'warning':
            return theme.iconAlertYellow;
        case 'destructive':
            return theme.iconAlertRed;
        // no default
    }
};

export const getIconSize = (size: ButtonSize) => {
    switch (size) {
        case 'large':
            return spacings.xl;
        case 'medium':
            return spacings.lg;
        case 'small':
            return spacings.md;
        case 'tiny':
            return spacings.sm;

        default:
            return spacings.xl;
    }
};

export const getVariantStyle = (variant: ButtonVariant, elevation: Elevation) => {
    switch (variant) {
        case 'primary':
            return css`
                background: ${({ theme }) => theme.backgroundPrimaryDefault};
                color: ${({ theme }) => theme.textOnPrimary};

                :hover,
                :active {
                    /* we use this color only for this case  */
                    background: ${({ theme }) => theme.backgroundPrimaryPressed};
                }
            `;

        case 'secondary':
            return css`
                background: ${({ theme }) => theme.backgroundSecondaryDefault};
                color: ${({ theme }) => theme.textOnSecondary};

                :hover,
                :active {
                    /* we use this color only for this case  */
                    background: ${({ theme }) => theme.backgroundSecondaryPressed};
                }
            `;
        case 'tertiary':
            return css`
                background: ${({ theme }) => theme[mapElevationToBackgroundTertiary[elevation]]};
                color: ${({ theme }) => theme.textOnTertiary};

                :hover,
                :active {
                    background: ${({ theme }) =>
                        theme[mapElevationToBackgroundTertiary[nextElevation[elevation]]]};
                }
            `;
        case 'info':
            return css`
                background: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation0};
                color: ${({ theme }) => theme.textAlertBlue};

                :hover,
                :active {
                    background: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
                }
            `;
        case 'warning':
            return css`
                background: ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation0};
                color: ${({ theme }) => theme.textAlertYellow};

                :hover,
                :active {
                    background: ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation1};
                }
            `;
        case 'destructive':
            return css`
                background: ${({ theme }) => theme.backgroundAlertRedSubtleOnElevation0};
                color: ${({ theme }) => theme.textAlertRed};

                :hover,
                :active {
                    background: ${({ theme }) => theme.backgroundAlertRedSubtleOnElevation1};
                }
            `;

        // no default
    }
};
