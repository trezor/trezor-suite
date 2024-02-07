import { css, DefaultTheme } from 'styled-components';
import { Color, Elevation, spacings, spacingsPx } from '@trezor/theme';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'info'
    | 'warning'
    | 'destructive';
export type ButtonSize = 'large' | 'medium' | 'small' | 'tiny';
export type IconAlignment = 'left' | 'right';

export const mapElevationToBackgroundTertiaryNormal: Record<Elevation, Color> = {
    '-1': 'interactionBackgroundTertiaryDefaultHoverOnElevation3', // For example left menu is negative elevation

    // Button lies always on elevation so for example Button that lies has elevation 0, lies on elevation -1.
    // This is why the values here a shifted by 1.
    0: 'interactionBackgroundTertiaryDefaultNormalOnElevationNegative',
    1: 'interactionBackgroundTertiaryDefaultNormalOnElevation0',
    2: 'interactionBackgroundTertiaryDefaultNormalOnElevation1',
    3: 'interactionBackgroundTertiaryDefaultNormalOnElevation2',
};

export const mapElevationToBackgroundTertiaryHover: Record<Elevation, Color> = {
    '-1': 'interactionBackgroundTertiaryDefaultHoverOnElevation3', // This is here just to satisfy Typescript mapping

    // Button lies always on elevation so for example Button that lies has elevation 0, lies on elevation -1.
    // This is why the values here a shifted by 1.
    0: 'interactionBackgroundTertiaryDefaultHoverOnElevationNegative',
    1: 'interactionBackgroundTertiaryDefaultHoverOnElevation0',
    2: 'interactionBackgroundTertiaryDefaultHoverOnElevation1',
    3: 'interactionBackgroundTertiaryDefaultHoverOnElevation2',
};

export const mapElevationToBackgroundInfoNormal: Record<Elevation, Color> = {
    '-1': 'interactionBackgroundInfoDefaultHoverOnElevation3', // For example left menu is negative elevation

    // Button lies always on elevation so for example Button that lies has elevation 0, lies on elevation -1.
    // This is why the values here a shifted by 1.
    0: 'interactionBackgroundInfoDefaultNormalOnElevationNegative',
    1: 'interactionBackgroundInfoDefaultNormalOnElevation0',
    2: 'interactionBackgroundInfoDefaultNormalOnElevation1',
    3: 'interactionBackgroundInfoDefaultNormalOnElevation2',
};

export const mapElevationToBackgroundInfoHover: Record<Elevation, Color> = {
    '-1': 'interactionBackgroundInfoDefaultHoverOnElevation3', // This is here just to satisfy Typescript mapping

    // Button lies always on elevation so for example Button that lies has elevation 0, lies on elevation -1.
    // This is why the values here a shifted by 1.
    0: 'interactionBackgroundInfoDefaultHoverOnElevationNegative',
    1: 'interactionBackgroundInfoDefaultHoverOnElevation0',
    2: 'interactionBackgroundInfoDefaultHoverOnElevation1',
    3: 'interactionBackgroundInfoDefaultHoverOnElevation2',
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
                background: ${({ theme }) =>
                    theme[mapElevationToBackgroundTertiaryNormal[elevation]]};
                color: ${({ theme }) => theme.textOnTertiary};

                :hover,
                :active {
                    background: ${({ theme }) =>
                        theme[mapElevationToBackgroundTertiaryHover[elevation]]};
                }
            `;
        case 'info':
            return css`
                background: ${({ theme }) => theme[mapElevationToBackgroundInfoNormal[elevation]]};
                color: ${({ theme }) => theme.textAlertBlue};

                :hover,
                :active {
                    background: ${({ theme }) =>
                        theme[mapElevationToBackgroundInfoHover[elevation]]};
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
