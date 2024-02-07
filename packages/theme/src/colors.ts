// If you want to add of modify colors, please read README.md to find out more.

import { Elevation } from './elevation';
import { palette } from './palette';
import { CSSColor } from './types';

export const mapElevationToBackground = ({ elevation }: { elevation: Elevation }): Color =>
    `backgroundSurfaceElevation${elevation !== -1 ? elevation : 'Negative'}`;

export const mapElevationToBorder = ({ elevation }: { elevation: Elevation }): Color => {
    const map: Record<Elevation, Color> = {
        '-1': 'borderOnElevationNegative', // For example left menu is negative elevation
        0: 'borderOnElevation0',
        1: 'borderOnElevation1',
        2: 'borderOnElevation0', // Todo: once we get tokens
        3: 'borderOnElevation1', // Todo: once we get tokens
    };

    return map[elevation];
};

// ---------------------------

// @TODO create iconDefaultInverse (packages/suite/src/components/suite/banners/Banner.tsx)

export const colorVariants = {
    standard: {
        transparent: '#00000000',

        // Deprecated
        gradientNeutralBottomFadeSurfaceElevation1Start: '#FFFFFF33', // Don't use it, use elevation colors
        gradientNeutralBottomFadeSurfaceElevation1End: '#FFFFFF', // Don't use it, use elevation colors
        backGroundOnboardingCard: '#FFFFFFBD',

        // Figma Colors
        backgroundAlertBlueBold: palette.lightAccentBlue600,
        backgroundAlertBlueSubtleOnElevation0: palette.lightAccentBlue300,
        backgroundAlertBlueSubtleOnElevation1: palette.lightAccentBlue200,
        backgroundAlertBlueSubtleOnElevationNegative: palette.lightAccentBlue400,
        backgroundAlertRedBold: palette.lightAccentRed600,
        backgroundAlertRedSubtleOnElevation0: palette.lightAccentRed300,
        backgroundAlertRedSubtleOnElevation1: palette.lightAccentRed200,
        backgroundAlertRedSubtleOnElevationNegative: palette.lightAccentRed400,
        backgroundAlertYellowBold: palette.lightAccentYellow600,
        backgroundAlertYellowSubtleOnElevation0: palette.lightAccentYellow300,
        backgroundAlertYellowSubtleOnElevation1: palette.lightAccentYellow200,
        backgroundAlertYellowSubtleOnElevationNegative: palette.lightAccentYellow400,
        backgroundNeutralBold: palette.lightGray1000,
        backgroundNeutralBoldInverted: palette.lightWhiteAlpha1000,
        backgroundNeutralDisabled: palette.lightGray200,
        backgroundNeutralSubdued: palette.lightGray400,
        backgroundNeutralSubtleOnElevation0: palette.lightGray200,
        backgroundNeutralSubtleOnElevation1: palette.lightGray100,
        backgroundNeutralSubtleOnElevationNegative: palette.lightGray300,
        backgroundPrimaryDefault: palette.lightPrimaryForest800,
        backgroundPrimaryPressed: palette.lightPrimaryForest900,
        backgroundPrimarySubtleOnElevation0: palette.lightPrimaryForest300,
        backgroundPrimarySubtleOnElevation1: palette.lightPrimaryForest200,
        backgroundPrimarySubtleOnElevationNegative: palette.lightPrimaryForest400,
        backgroundSecondaryDefault: palette.lightSecondaryEmerald800,
        backgroundSecondaryPressed: palette.lightSecondaryEmerald900,
        backgroundSurfaceElevation0: palette.lightGray100,
        backgroundSurfaceElevation1: palette.lightWhiteAlpha1000,
        backgroundSurfaceElevation2: palette.lightGray100,
        backgroundSurfaceElevation3: palette.lightWhiteAlpha1000,
        backgroundSurfaceElevationNegative: palette.lightGray200,
        backgroundTertiaryDefaultOnElevation0: palette.lightGray200,
        backgroundTertiaryDefaultOnElevation1: palette.lightGray100,
        backgroundTertiaryDefaultOnElevationNegative: palette.lightGray300,
        backgroundTertiaryPressedOnElevation0: palette.lightGray300,
        backgroundTertiaryPressedOnElevation1: palette.lightGray200,
        backgroundTertiaryPressedOnElevationNegative: palette.lightGray400,
        borderAlertRed: palette.lightAccentRed600,
        borderDashed: palette.lightGray400,
        borderFocus: palette.lightGray300,
        borderInverted: palette.lightWhiteAlpha1000,
        borderOnElevation0: palette.lightGray300,
        borderOnElevation1: palette.lightGray200,
        borderOnElevationNegative: palette.lightGray400,
        borderSecondary: palette.lightSecondaryEmerald800,
        borderSubtleInverted: palette.lightWhiteAlpha400,
        iconAlertBlue: palette.lightAccentBlue700,
        iconAlertRed: palette.lightAccentRed700,
        iconAlertYellow: palette.lightAccentYellow700,
        iconDefault: palette.lightGray1000,
        iconDefaultInverted: palette.lightWhiteAlpha1000,
        iconDisabled: palette.lightGray600,
        iconOnPrimary: palette.lightWhiteAlpha1000,
        iconOnSecondary: palette.lightWhiteAlpha1000,
        iconOnTertiary: palette.lightGray800,
        iconPrimaryDefault: palette.lightPrimaryForest800,
        iconPrimaryPressed: palette.lightPrimaryForest900,
        iconSubdued: palette.lightGray700,
        interactionBackgroundDestructiveDefaultHoverOnElevation0: palette.lightAccentRed300,
        interactionBackgroundDestructiveDefaultHoverOnElevation1: palette.lightAccentRed200,
        interactionBackgroundDestructiveDefaultHoverOnElevation2: palette.lightAccentRed300,
        interactionBackgroundDestructiveDefaultHoverOnElevation3: palette.lightAccentRed200,
        interactionBackgroundDestructiveDefaultHoverOnElevationNegative: palette.lightAccentRed400,
        interactionBackgroundDestructiveDefaultNormalOnElevation0: palette.lightAccentRed200,
        interactionBackgroundDestructiveDefaultNormalOnElevation1: palette.lightAccentRed100,
        interactionBackgroundDestructiveDefaultNormalOnElevation2: palette.lightAccentRed200,
        interactionBackgroundDestructiveDefaultNormalOnElevation3: palette.lightAccentRed100,
        interactionBackgroundDestructiveDefaultNormalOnElevationNegative: palette.lightAccentRed300,
        interactionBackgroundInfoDefaultHoverOnElevation0: palette.lightAccentBlue300,
        interactionBackgroundInfoDefaultHoverOnElevation1: palette.lightAccentBlue200,
        interactionBackgroundInfoDefaultHoverOnElevation2: palette.lightAccentBlue300,
        interactionBackgroundInfoDefaultHoverOnElevation3: palette.lightAccentBlue200,
        interactionBackgroundInfoDefaultHoverOnElevationNegative: palette.lightAccentBlue400,
        interactionBackgroundInfoDefaultNormalOnElevation0: palette.lightAccentBlue200,
        interactionBackgroundInfoDefaultNormalOnElevation1: palette.lightAccentBlue100,
        interactionBackgroundInfoDefaultNormalOnElevation2: palette.lightAccentBlue200,
        interactionBackgroundInfoDefaultNormalOnElevation3: palette.lightAccentBlue100,
        interactionBackgroundInfoDefaultNormalOnElevationNegative: palette.lightAccentBlue300,
        interactionBackgroundTertiaryDefaultHoverOnElevation0: palette.lightGray300,
        interactionBackgroundTertiaryDefaultHoverOnElevation1: palette.lightGray200,
        interactionBackgroundTertiaryDefaultHoverOnElevation2: palette.lightGray300,
        interactionBackgroundTertiaryDefaultHoverOnElevation3: palette.lightGray200,
        interactionBackgroundTertiaryDefaultHoverOnElevationNegative: palette.lightGray400,
        interactionBackgroundTertiaryDefaultNormalOnElevation0: palette.lightGray200,
        interactionBackgroundTertiaryDefaultNormalOnElevation1: palette.lightGray100,
        interactionBackgroundTertiaryDefaultNormalOnElevation2: palette.lightGray200,
        interactionBackgroundTertiaryDefaultNormalOnElevation3: palette.lightGray100,
        interactionBackgroundTertiaryDefaultNormalOnElevationNegative: palette.lightGray300,
        interactionBackgroundWarningDefaultHoverOnElevation0: palette.lightAccentYellow300,
        interactionBackgroundWarningDefaultHoverOnElevation1: palette.lightAccentYellow200,
        interactionBackgroundWarningDefaultHoverOnElevation2: palette.lightAccentYellow300,
        interactionBackgroundWarningDefaultHoverOnElevation3: palette.lightAccentYellow200,
        interactionBackgroundWarningDefaultHoverOnElevationNegative: palette.lightAccentYellow400,
        interactionBackgroundWarningDefaultNormalOnElevation0: palette.lightAccentYellow200,
        interactionBackgroundWarningDefaultNormalOnElevation1: palette.lightAccentYellow100,
        interactionBackgroundWarningDefaultNormalOnElevation2: palette.lightAccentYellow200,
        interactionBackgroundWarningDefaultNormalOnElevation3: palette.lightAccentYellow100,
        interactionBackgroundWarningDefaultNormalOnElevationNegative: palette.lightAccentYellow300,
        textAlertBlue: palette.lightAccentBlue700,
        textAlertRed: palette.lightAccentRed700,
        textAlertYellow: palette.lightAccentYellow700,
        textDefault: palette.lightGray1000,
        textDefaultInverted: palette.lightWhiteAlpha1000,
        textDisabled: palette.lightGray600,
        textOnPrimary: palette.lightWhiteAlpha1000,
        textOnSecondary: palette.lightWhiteAlpha1000,
        textOnTertiary: palette.lightGray800,
        textPrimaryDefault: palette.lightPrimaryForest800,
        textPrimaryPressed: palette.lightPrimaryForest900,
        textSecondaryHighlight: palette.lightSecondaryEmerald800,
        textSubdued: palette.lightGray700,
    },
    dark: {
        transparent: '#00000000',

        // Deprecated
        gradientNeutralBottomFadeSurfaceElevation1Start: '#00000033', // Don't use it, use elevation colors
        gradientNeutralBottomFadeSurfaceElevation1End: '#000000', // Don't use it, use elevation colors
        backGroundOnboardingCard: '#000000BD',

        // Figma Colors
        backgroundAlertBlueBold: palette.darkAccentBlue600,
        backgroundAlertBlueSubtleOnElevation0: palette.darkAccentBlue50,
        backgroundAlertBlueSubtleOnElevation1: palette.darkAccentBlue100,
        backgroundAlertBlueSubtleOnElevationNegative: '#FFFFFF',
        backgroundAlertRedBold: palette.darkAccentRed600,
        backgroundAlertRedSubtleOnElevation0: palette.darkAccentRed50,
        backgroundAlertRedSubtleOnElevation1: palette.darkAccentRed100,
        backgroundAlertRedSubtleOnElevationNegative: '#FFFFFF',
        backgroundAlertYellowBold: palette.darkAccentYellow600,
        backgroundAlertYellowSubtleOnElevation0: palette.darkAccentYellow50,
        backgroundAlertYellowSubtleOnElevation1: palette.darkAccentYellow100,
        backgroundAlertYellowSubtleOnElevationNegative: '#FFFFFF',
        backgroundNeutralBold: palette.darkGray1000,
        backgroundNeutralBoldInverted: palette.darkGray000,
        backgroundNeutralDisabled: palette.darkGray200,
        backgroundNeutralSubdued: palette.darkGray300,
        backgroundNeutralSubtleOnElevation0: palette.darkGray100,
        backgroundNeutralSubtleOnElevation1: palette.darkGray200,
        backgroundNeutralSubtleOnElevationNegative: palette.darkGray50,
        backgroundPrimaryDefault: palette.darkPrimaryForest800,
        backgroundPrimaryPressed: palette.darkPrimaryForest900,
        backgroundPrimarySubtleOnElevation0: palette.darkPrimaryForest100,
        backgroundPrimarySubtleOnElevation1: palette.darkPrimaryForest200,
        backgroundPrimarySubtleOnElevationNegative: palette.darkPrimaryForest100,
        backgroundSecondaryDefault: palette.darkSecondaryGreen800,
        backgroundSecondaryPressed: palette.darkSecondaryGreen900,
        backgroundSurfaceElevation0: palette.darkGray50,
        backgroundSurfaceElevation1: palette.darkGray100,
        backgroundSurfaceElevation2: palette.darkGray200,
        backgroundSurfaceElevation3: palette.darkGray300,
        backgroundSurfaceElevationNegative: palette.darkGray000,
        backgroundTertiaryDefaultOnElevation0: palette.darkGray100,
        backgroundTertiaryDefaultOnElevation1: palette.darkGray200,
        backgroundTertiaryDefaultOnElevationNegative: palette.darkGray50,
        backgroundTertiaryPressedOnElevation0: palette.darkGray200,
        backgroundTertiaryPressedOnElevation1: palette.darkGray300,
        backgroundTertiaryPressedOnElevationNegative: palette.darkGray100,
        borderAlertRed: palette.darkAccentRed600,
        borderDashed: palette.darkGray200,
        borderFocus: palette.darkGray200,
        borderInverted: palette.darkGray000,
        borderOnElevation0: palette.darkGray100,
        borderOnElevation1: palette.darkGray200,
        borderOnElevationNegative: '#FFFFFF',
        borderSecondary: palette.darkSecondaryGreen800,
        borderSubtleInverted: '#0000007F',
        iconAlertBlue: palette.darkAccentBlue700,
        iconAlertRed: palette.darkAccentRed700,
        iconAlertYellow: palette.darkAccentYellow600,
        iconDefault: palette.darkGray1000,
        iconDefaultInverted: palette.darkGray000,
        iconDisabled: palette.darkGray600,
        iconOnPrimary: palette.darkGray000,
        iconOnSecondary: palette.darkGray000,
        iconOnTertiary: palette.darkGray800,
        iconPrimaryDefault: palette.darkPrimaryForest800,
        iconPrimaryPressed: palette.darkPrimaryForest900,
        iconSubdued: palette.darkGray700,
        interactionBackgroundDestructiveDefaultHoverOnElevation0: palette.darkAccentRed200,
        interactionBackgroundDestructiveDefaultHoverOnElevation1: palette.darkAccentRed300,
        interactionBackgroundDestructiveDefaultHoverOnElevation2: palette.darkAccentRed400,
        interactionBackgroundDestructiveDefaultHoverOnElevation3: palette.darkAccentRed500,
        interactionBackgroundDestructiveDefaultHoverOnElevationNegative: palette.darkAccentRed100,
        interactionBackgroundDestructiveDefaultNormalOnElevation0: palette.darkAccentRed100,
        interactionBackgroundDestructiveDefaultNormalOnElevation1: palette.darkAccentRed200,
        interactionBackgroundDestructiveDefaultNormalOnElevation2: palette.darkAccentRed300,
        interactionBackgroundDestructiveDefaultNormalOnElevation3: palette.darkAccentRed400,
        interactionBackgroundDestructiveDefaultNormalOnElevationNegative: palette.darkAccentRed50,
        interactionBackgroundInfoDefaultHoverOnElevation0: palette.darkAccentBlue200,
        interactionBackgroundInfoDefaultHoverOnElevation1: palette.darkAccentBlue300,
        interactionBackgroundInfoDefaultHoverOnElevation2: palette.darkAccentBlue400,
        interactionBackgroundInfoDefaultHoverOnElevation3: palette.darkAccentBlue500,
        interactionBackgroundInfoDefaultHoverOnElevationNegative: palette.darkAccentBlue100,
        interactionBackgroundInfoDefaultNormalOnElevation0: palette.darkAccentBlue100,
        interactionBackgroundInfoDefaultNormalOnElevation1: palette.darkAccentBlue200,
        interactionBackgroundInfoDefaultNormalOnElevation2: palette.darkAccentBlue300,
        interactionBackgroundInfoDefaultNormalOnElevation3: palette.darkAccentBlue400,
        interactionBackgroundInfoDefaultNormalOnElevationNegative: palette.darkAccentBlue50,
        interactionBackgroundTertiaryDefaultHoverOnElevation0: palette.darkGray200,
        interactionBackgroundTertiaryDefaultHoverOnElevation1: palette.darkGray300,
        interactionBackgroundTertiaryDefaultHoverOnElevation2: palette.darkGray400,
        interactionBackgroundTertiaryDefaultHoverOnElevation3: palette.darkGray500,
        interactionBackgroundTertiaryDefaultHoverOnElevationNegative: palette.darkGray100,
        interactionBackgroundTertiaryDefaultNormalOnElevation0: palette.darkGray100,
        interactionBackgroundTertiaryDefaultNormalOnElevation1: palette.darkGray200,
        interactionBackgroundTertiaryDefaultNormalOnElevation2: palette.darkGray300,
        interactionBackgroundTertiaryDefaultNormalOnElevation3: palette.darkGray400,
        interactionBackgroundTertiaryDefaultNormalOnElevationNegative: palette.darkGray50,
        interactionBackgroundWarningDefaultHoverOnElevation0: palette.darkAccentYellow200,
        interactionBackgroundWarningDefaultHoverOnElevation1: palette.darkAccentYellow300,
        interactionBackgroundWarningDefaultHoverOnElevation2: palette.darkAccentYellow400,
        interactionBackgroundWarningDefaultHoverOnElevation3: palette.darkAccentYellow500,
        interactionBackgroundWarningDefaultHoverOnElevationNegative: palette.darkAccentYellow100,
        interactionBackgroundWarningDefaultNormalOnElevation0: palette.darkAccentYellow100,
        interactionBackgroundWarningDefaultNormalOnElevation1: palette.darkAccentYellow200,
        interactionBackgroundWarningDefaultNormalOnElevation2: palette.darkAccentYellow300,
        interactionBackgroundWarningDefaultNormalOnElevation3: palette.darkAccentYellow400,
        interactionBackgroundWarningDefaultNormalOnElevationNegative: palette.darkAccentYellow50,
        textAlertBlue: palette.darkAccentBlue700,
        textAlertRed: palette.darkAccentRed700,
        textAlertYellow: palette.darkAccentYellow600,
        textDefault: palette.darkGray1000,
        textDefaultInverted: palette.darkGray000,
        textDisabled: palette.darkGray600,
        textOnPrimary: palette.darkGray000,
        textOnSecondary: palette.darkGray000,
        textOnTertiary: palette.darkGray800,
        textPrimaryDefault: palette.darkPrimaryForest800,
        textPrimaryPressed: palette.darkPrimaryForest900,
        textSecondaryHighlight: palette.darkSecondaryGreen800,
        textSubdued: palette.darkGray700,
    },
} as const;

export type Color = keyof typeof colorVariants.standard;
export type Colors = Record<Color, CSSColor>;
export type ThemeColorVariant = keyof typeof colorVariants;
