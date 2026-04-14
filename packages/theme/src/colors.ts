// If you want to add of modify colors, please read README.md to find out more.

import { colorsV2 } from './colorsV2';
import { type Elevation } from './elevation';
import { paletteV1 } from './paletteV1';
import { type CSSColor } from './types';

export type StyledComponentElevationProps = {
    theme: Colors; // this package does not depend on styled-components
    $elevation: Elevation;
};

const elevationToBackgroundTokenMap = {
    [-1]: 'surfaceFillSunken',
    0: 'surfaceFillPage',
    1: 'surfaceFillRaised',
    2: 'legacyBackgroundSurfaceElevation2',
    3: 'legacyBackgroundSurfaceElevation3',
} as const satisfies Record<Elevation, Color>;

const elevationToBorderTokenMap = {
    [-1]: 'legacyBorderElevationNegative',
    0: 'legacyBorderElevation0',
    1: 'legacyBorderElevation1',
    2: 'legacyBorderElevation2',
    3: 'legacyBorderElevation3',
} as const satisfies Record<Elevation, Color>;

export const mapElevationToBackgroundToken = ({ $elevation }: { $elevation: Elevation }): Color =>
    elevationToBackgroundTokenMap[$elevation];

export const mapElevationToBackground = ({
    theme,
    $elevation,
}: StyledComponentElevationProps): CSSColor => theme[mapElevationToBackgroundToken({ $elevation })];

export const mapElevationToBorder = ({
    theme,
    $elevation,
}: StyledComponentElevationProps): CSSColor => theme[elevationToBorderTokenMap[$elevation]];

// ---------------------------

const light = {
    transparent: '#00000000',

    // Figma Colors
    legacyBackgroundAlertBlueBold: paletteV1.lightAccentBlue600,
    legacyBackgroundAlertBlueBoldAlt: paletteV1.lightAccentBlue700,
    legacyBackgroundAlertBlueSubtleOnElevationNegative: paletteV1.lightAccentBlue400,
    legacyBackgroundAlertBlueSubtleOnElevation0: paletteV1.lightAccentBlue300,
    legacyBackgroundAlertBlueSubtleOnElevation1: paletteV1.lightAccentBlue200,
    legacyBackgroundAlertBlueSubtleOnElevation2: paletteV1.lightAccentBlue300,
    legacyBackgroundAlertPurpleBold: paletteV1.lightAccentPurple600,
    legacyBackgroundAlertPurpleBoldAlt: paletteV1.lightAccentPurple700,
    legacyBackgroundAlertPurpleSubtleOnElevationNegative: paletteV1.lightAccentPurple400,
    legacyBackgroundAlertPurpleSubtleOnElevation0: paletteV1.lightAccentPurple300,
    legacyBackgroundAlertPurpleSubtleOnElevation1: paletteV1.lightAccentPurple200,
    legacyBackgroundAlertPurpleSubtleOnElevation2: paletteV1.lightAccentPurple300,
    legacyBackgroundAlertRedBold: paletteV1.lightAccentRed600,
    legacyBackgroundAlertRedBoldAlt: paletteV1.lightAccentRed700,
    legacyBackgroundAlertRedSubtleOnElevationNegative: paletteV1.lightAccentRed400,
    legacyBackgroundAlertRedSubtleOnElevation0: paletteV1.lightAccentRed300,
    legacyBackgroundAlertRedSubtleOnElevation1: paletteV1.lightAccentRed200,
    legacyBackgroundAlertRedSubtleOnElevation2: paletteV1.lightAccentRed300,
    legacyBackgroundAlertYellowBold: paletteV1.lightAccentYellow600,
    legacyBackgroundAlertYellowBoldAlt: paletteV1.lightAccentYellow700,
    legacyBackgroundAlertYellowSubtleOnElevationNegative: paletteV1.lightAccentYellow400,
    legacyBackgroundAlertYellowSubtleOnElevation0: paletteV1.lightAccentYellow300,
    legacyBackgroundAlertYellowSubtleOnElevation1: paletteV1.lightAccentYellow200,
    legacyBackgroundAlertYellowSubtleOnElevation2: paletteV1.lightAccentYellow300,
    legacyBackgroundNeutralBold: paletteV1.lightGray1000,
    legacyBackgroundNeutralBoldInverted: paletteV1.lightWhiteAlpha1000,
    legacyBackgroundNeutralSubtleOnElevationNegative: paletteV1.lightGray400,
    legacyBackgroundNeutralSubtleOnElevation0: paletteV1.lightGray300,
    legacyBackgroundNeutralSubtleOnElevation1: paletteV1.lightGray200,
    legacyBackgroundPrimaryDefault: paletteV1.lightPrimaryForest800,
    legacyBackgroundPrimaryPressed: paletteV1.lightPrimaryForest900,
    legacyBackgroundPrimarySubtleOnElevationNegative: paletteV1.lightPrimaryForest400,
    legacyBackgroundPrimarySubtleOnElevation0: paletteV1.lightPrimaryForest300,
    legacyBackgroundPrimarySubtleOnElevation1: paletteV1.lightPrimaryForest200,
    legacyBackgroundSecondaryDefault: paletteV1.lightSecondaryEmerald800,
    legacyBackgroundSecondaryPressed: paletteV1.lightSecondaryEmerald900,
    legacyBackgroundSurfaceElevation2: paletteV1.lightGray100,
    legacyBackgroundSurfaceElevation3: paletteV1.lightWhiteAlpha1000,
    legacyBackgroundTertiaryDefaultOnElevationNegative: paletteV1.lightGray400,
    legacyBackgroundTertiaryDefaultOnElevation0: paletteV1.lightGray300,
    legacyBackgroundTertiaryDefaultOnElevation1: paletteV1.lightGray200,
    legacyBackgroundTertiaryPressedOnElevationNegative: paletteV1.lightGray300,
    legacyBackgroundTertiaryPressedOnElevation0: paletteV1.lightGray400,
    legacyBackgroundTertiaryPressedOnElevation1: paletteV1.lightGray300,
    legacyBorderInverted: paletteV1.lightWhiteAlpha1000,
    legacyBorderSubtleInverted: paletteV1.lightWhiteAlpha400,

    // non-valid tokens (should be removed)
    legacyBorderElevationNegative: paletteV1.lightGray400,
    legacyBorderElevation0: paletteV1.lightGray300,
    legacyBorderElevation1: paletteV1.lightGray200,
    legacyBorderElevation2: paletteV1.lightGray200,
    legacyBorderElevation3: paletteV1.lightGray200,
    logoBg: paletteV1.lightGray900,
    logoFg: paletteV1.lightGray100,

    ...colorsV2.light,
};

export type ThemeVariant = 'debug' | 'standard' | 'dark' | 'light';
export type ThemeColorVariant = 'debug' | 'standard' | 'dark';

export type Color = keyof typeof light;
export type Colors = Record<Color, CSSColor>;

export const colorVariants: Record<ThemeColorVariant, Colors> = {
    debug: {
        ...light,
        surfaceFillSunken: '#F09EA7',
        surfaceFillPage: '#F6CA94',
        surfaceFillRaised: '#C1EBC0',
        legacyBackgroundSurfaceElevation2: '#9DB6F3',
        legacyBackgroundSurfaceElevation3: '#a0a0a6',

        legacyBorderElevationNegative: '#ED4456',
        legacyBorderElevation0: '#FEB144',
        legacyBorderElevation1: '#74DF74',
        legacyBorderElevation2: '#3CA6EC',
        legacyBorderElevation3: '#6A6A78',
    } as Colors,

    standard: light as Colors,

    dark: {
        transparent: '#00000000',

        // Figma Colors
        legacyBackgroundAlertBlueBold: paletteV1.darkAccentBlue600,
        legacyBackgroundAlertBlueBoldAlt: paletteV1.darkAccentBlue700,
        legacyBackgroundAlertBlueSubtleOnElevationNegative: paletteV1.darkAccentBlue100,
        legacyBackgroundAlertBlueSubtleOnElevation0: paletteV1.darkAccentBlue200,
        legacyBackgroundAlertBlueSubtleOnElevation1: paletteV1.darkAccentBlue300,
        legacyBackgroundAlertBlueSubtleOnElevation2: paletteV1.darkAccentBlue400,
        legacyBackgroundAlertPurpleBold: paletteV1.darkAccentPurple600,
        legacyBackgroundAlertPurpleBoldAlt: paletteV1.darkAccentPurple700,
        legacyBackgroundAlertPurpleSubtleOnElevationNegative: paletteV1.darkAccentPurple100,
        legacyBackgroundAlertPurpleSubtleOnElevation0: paletteV1.darkAccentPurple200,
        legacyBackgroundAlertPurpleSubtleOnElevation1: paletteV1.darkAccentPurple300,
        legacyBackgroundAlertPurpleSubtleOnElevation2: paletteV1.darkAccentPurple400,
        legacyBackgroundAlertRedBold: paletteV1.darkAccentRed600,
        legacyBackgroundAlertRedBoldAlt: paletteV1.darkAccentRed700,
        legacyBackgroundAlertRedSubtleOnElevationNegative: paletteV1.darkAccentRed100,
        legacyBackgroundAlertRedSubtleOnElevation0: paletteV1.darkAccentRed200,
        legacyBackgroundAlertRedSubtleOnElevation1: paletteV1.darkAccentRed300,
        legacyBackgroundAlertRedSubtleOnElevation2: paletteV1.darkAccentRed400,
        legacyBackgroundAlertYellowBold: paletteV1.darkAccentYellow600,
        legacyBackgroundAlertYellowBoldAlt: paletteV1.darkAccentYellow700,
        legacyBackgroundAlertYellowSubtleOnElevationNegative: paletteV1.darkAccentYellow100,
        legacyBackgroundAlertYellowSubtleOnElevation0: paletteV1.darkAccentYellow200,
        legacyBackgroundAlertYellowSubtleOnElevation1: paletteV1.darkAccentYellow300,
        legacyBackgroundAlertYellowSubtleOnElevation2: paletteV1.darkAccentYellow400,
        legacyBackgroundNeutralBold: paletteV1.darkGray1000,
        legacyBackgroundNeutralBoldInverted: paletteV1.darkGray000,
        legacyBackgroundNeutralSubtleOnElevationNegative: paletteV1.darkGray100,
        legacyBackgroundNeutralSubtleOnElevation0: paletteV1.darkGray300,
        legacyBackgroundNeutralSubtleOnElevation1: paletteV1.darkGray300,
        legacyBackgroundPrimaryDefault: paletteV1.darkPrimaryForest800,
        legacyBackgroundPrimaryPressed: paletteV1.darkPrimaryForest900,
        legacyBackgroundPrimarySubtleOnElevationNegative: paletteV1.darkPrimaryForest100,
        legacyBackgroundPrimarySubtleOnElevation0: paletteV1.darkPrimaryForest200,
        legacyBackgroundPrimarySubtleOnElevation1: paletteV1.darkPrimaryForest300,
        legacyBackgroundSecondaryDefault: paletteV1.darkSecondaryGreen800,
        legacyBackgroundSecondaryPressed: paletteV1.darkSecondaryGreen900,
        legacyBackgroundSurfaceElevation2: paletteV1.darkGray200,
        legacyBackgroundSurfaceElevation3: paletteV1.darkGray300,
        legacyBackgroundTertiaryDefaultOnElevationNegative: paletteV1.darkGray100,
        legacyBackgroundTertiaryDefaultOnElevation0: paletteV1.darkGray200,
        legacyBackgroundTertiaryDefaultOnElevation1: paletteV1.darkGray300,
        legacyBackgroundTertiaryPressedOnElevationNegative: paletteV1.darkGray200,
        legacyBackgroundTertiaryPressedOnElevation0: paletteV1.darkGray300,
        legacyBackgroundTertiaryPressedOnElevation1: paletteV1.darkGray400,
        legacyBorderInverted: paletteV1.darkGray000,
        legacyBorderSubtleInverted: paletteV1.lightBlackAlpha600,

        // non-valid tokens (should be removed)
        legacyBorderElevationNegative: paletteV1.darkGray50,
        legacyBorderElevation0: paletteV1.darkGray100,
        legacyBorderElevation1: paletteV1.darkGray200,
        legacyBorderElevation2: paletteV1.darkGray300,
        legacyBorderElevation3: paletteV1.darkGray400,
        logoBg: paletteV1.darkGray900,
        logoFg: paletteV1.darkGray100,

        ...colorsV2.dark,
    } as Colors,
} as const;

export const COLOR_TOKENS = Object.keys(light);
