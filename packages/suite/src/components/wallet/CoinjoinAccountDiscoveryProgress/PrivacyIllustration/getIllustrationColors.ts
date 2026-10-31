import { type DefaultTheme } from 'styled-components';

import { palette } from '@trezor/theme';

/**
 * Colour roles of the illustration. Violet is the only Tor colour, green means "yours" and orange
 * is only ever a brief glow. Some roles have no semantic token and differ per mode for contrast.
 */
export const getIllustrationColors = (theme: DefaultTheme) => {
    const isDark = theme.mode === 'dark';

    return {
        card: theme.surfaceFillRaised,
        ink: theme.contentPrimary,
        // Light tertiary content is too faint for 12 px labels on the card.
        label: isDark ? theme.contentTertiary : theme.contentSecondary,
        boxStroke: theme.contentTertiary,
        screenTint: isDark ? palette.globalWhiteAlpha50 : palette.lightCoolGreyAlpha25,
        violet: isDark ? theme.contentAccentViolet : palette.lightViolet600,
        violetText: theme.contentAccentViolet,
        keep: isDark ? theme.contentBrand : palette.lightGreen600,
        ember: isDark ? palette.darkOrange600 : palette.lightOrange500,
        spark: isDark ? palette.darkYellow700 : palette.lightOrange600,
        wireAlpha: isDark ? 0.17 : 0.2,
        relayAlpha: isDark ? 0.42 : 0.5,
        glyphAlpha: isDark ? 0.66 : 0.6,
        cellAlpha: isDark ? 0.3 : 0.2,
        pillAlpha: isDark ? 0.24 : 0.28,
        ashAlpha: isDark ? 0.4 : 0.3,
        emberAlpha: isDark ? 0.55 : 0.62,
        violetGlowAlpha: isDark ? 0.17 : 0.13,
        keepSoftAlpha: isDark ? 0.18 : 0.14,
        separatorAlpha: 0.08,
    };
};
