import { css } from 'styled-components';

import { Color, Colors, Elevation, spacings, spacingsPx } from '@trezor/theme';
import { capitalizeFirstLetter } from '@trezor/utils';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'info'
    | 'warning'
    | 'destructive';

export type ButtonSize = 'large' | 'medium' | 'small' | 'tiny';
export type ButtonState = 'normal' | 'hover';
export type IconAlignment = 'left' | 'right';

const mapElevationToButtonBackground = ({
    elevation,
    variant,
    state,
}: {
    elevation: Elevation;
    variant: 'destructive' | 'tertiary' | 'info' | 'warning';
    state: ButtonState;
}) => {
    const capitalizedVariant = capitalizeFirstLetter(variant);
    const capitalizedState = capitalizeFirstLetter(state);

    const map: Record<Elevation, Color> = {
        '-1': `interactionBackground${capitalizedVariant}DefaultHoverOnElevation3`, // For example left menu is negative elevation

        // Button lies always on elevation so for example Button that lies has elevation 0, lies on elevation -1.
        // This is why the values here a shifted by 1.
        0: `interactionBackground${capitalizedVariant}Default${capitalizedState}OnElevationNegative`,
        1: `interactionBackground${capitalizedVariant}Default${capitalizedState}OnElevation0`,
        2: `interactionBackground${capitalizedVariant}Default${capitalizedState}OnElevation1`,
        3: `interactionBackground${capitalizedVariant}Default${capitalizedState}OnElevation2`,
    };

    return ({ theme }: { theme: Colors }) => theme[map[elevation]];
};

export const getPadding = (size: ButtonSize, hasLabel?: boolean) => {
    const map: Record<ButtonSize, string> = {
        small: hasLabel ? `${spacingsPx.xs} ${spacingsPx.md}` : '10px',
        large: hasLabel ? `${spacingsPx.md} ${spacingsPx.xl}` : `${spacingsPx.md}`,
        medium: hasLabel ? `${spacingsPx.sm} ${spacingsPx.lg}` : '14px',
        tiny: hasLabel ? `${spacingsPx.xxxs} ${spacingsPx.xs}` : '6px',
    };

    return map[size];
};

export const getIconColor = (variant: ButtonVariant, isDisabled: boolean, theme: Colors) => {
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

export const getVariantStyle = (
    variant: ButtonVariant,
    elevation: Elevation,
): ReturnType<typeof css> => {
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
                background: ${mapElevationToButtonBackground({
                    elevation,
                    variant,
                    state: 'normal',
                })};
                color: ${({ theme }) => theme.textOnTertiary};

                :hover,
                :active {
                    background: ${mapElevationToButtonBackground({
                        elevation,
                        variant,
                        state: 'hover',
                    })};
                }
            `;
        case 'info':
            return css`
                background: ${mapElevationToButtonBackground({
                    elevation,
                    variant,
                    state: 'normal',
                })};
                color: ${({ theme }) => theme.textAlertBlue};

                :hover,
                :active {
                    background: ${mapElevationToButtonBackground({
                        elevation,
                        variant,
                        state: 'hover',
                    })};
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
