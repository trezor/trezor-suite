import { css, DefaultTheme } from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'large' | 'medium' | 'small' | 'tiny';
export type IconAlignment = 'left' | 'right';

export const getPadding = (size: ButtonSize, hasLabel?: boolean) => {
    switch (size) {
        case 'large':
            return hasLabel ? `${spacingsPx.md} ${spacingsPx.xl}` : `${spacingsPx.md}`;
        case 'medium':
            return hasLabel ? `${spacingsPx.sm} ${spacingsPx.lg}` : '14px';
        case 'small':
            return hasLabel ? `${spacingsPx.xs} ${spacingsPx.md}` : '10px';
        case 'tiny':
            return hasLabel ? `${spacingsPx.xxxs} ${spacingsPx.xs}` : '8px';

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
            return spacings.md;

        default:
            return spacings.xl;
    }
};

export const getVariantStyle = (variant: ButtonVariant) => {
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
                background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
                color: ${({ theme }) => theme.textOnTertiary};

                :hover,
                :active {
                    background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
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
