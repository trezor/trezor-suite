import { type Color, type TypographyStyle, nativeBorders, nativeSpacings } from '@trezor/theme';

import type {
    ButtonColorProps,
    ButtonIntent,
    ButtonPriority,
    ButtonSize,
    InverseKey,
    TextButtonSize,
} from './types';

type FilledButtonIntent = Exclude<ButtonIntent, 'neutral'>;

const colorMapDisabled = {
    normal: 'contentDisabled',
    inverse: 'contentOnDarkDisabled',
} as const satisfies Record<InverseKey, Color>;

const colorMap = {
    normal: {
        primary: {
            brand: 'contentButtonBrandPrimary',
            neutral: 'contentPrimaryInverse',
            info: 'contentButtonInfoPrimary',
            warning: 'contentButtonWarningPrimary',
            critical: 'contentButtonCriticalPrimary',
            accentViolet: 'contentButtonAccentVioletPrimary',
        },
        secondary: {
            brand: 'contentBrand',
            neutral: 'contentNeutral',
            info: 'contentInfo',
            warning: 'contentWarning',
            critical: 'contentCritical',
            accentViolet: 'contentAccentViolet',
        },
    },
    inverse: {
        primary: {
            brand: 'contentOnDarkButtonBrandPrimary',
            neutral: 'contentOnDarkPrimaryInverse',
            info: 'contentOnDarkButtonInfoPrimary',
            warning: 'contentOnDarkButtonWarningPrimary',
            critical: 'contentOnDarkButtonCriticalPrimary',
            accentViolet: 'contentOnDarkButtonAccentVioletPrimary',
        },
        secondary: {
            brand: 'contentOnDarkBrand',
            neutral: 'contentOnDarkNeutral',
            info: 'contentOnDarkInfo',
            warning: 'contentOnDarkWarning',
            critical: 'contentOnDarkCritical',
            accentViolet: 'contentOnDarkAccentViolet',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

const backgroundMapDisabled = {
    normal: {
        primary: 'elementFillBoldDisabled',
        secondary: 'elementFillSoftDisabled',
    },
    inverse: {
        primary: 'elementFillOnDarkBoldDisabled',
        secondary: 'elementFillOnDarkSoftDisabled',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const backgroundMapBase = {
    normal: {
        primary: {
            brand: 'elementFillBrandBold',
            neutral: 'elementFillContrast',
            info: 'elementFillInfoBold',
            warning: 'elementFillWarningBold',
            critical: 'elementFillCriticalBold',
            accentViolet: 'elementFillAccentVioletBold',
        },
        secondary: {
            brand: 'elementFillBrandSoft',
            neutral: 'elementFillNeutralSoft',
            info: 'elementFillInfoSoft',
            warning: 'elementFillWarningSoft',
            critical: 'elementFillCriticalSoft',
            accentViolet: 'elementFillAccentVioletSoft',
        },
    },
    inverse: {
        primary: {
            brand: 'elementFillOnDarkBrandBold',
            neutral: 'elementFillOnDarkContrast',
            info: 'elementFillOnDarkInfoBold',
            warning: 'elementFillOnDarkWarningBold',
            critical: 'elementFillOnDarkCriticalBold',
            accentViolet: 'elementFillOnDarkAccentVioletBold',
        },
        secondary: {
            brand: 'elementFillOnDarkBrandSoft',
            neutral: 'elementFillOnDarkNeutralSoft',
            info: 'elementFillOnDarkInfoSoft',
            warning: 'elementFillOnDarkWarningSoft',
            critical: 'elementFillOnDarkCriticalSoft',
            accentViolet: 'elementFillOnDarkAccentVioletSoft',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

const backgroundMapPressed = {
    normal: {
        primary: {
            brand: 'elementFillBrandBoldPressed',
            neutral: 'elementFillContrastPressed',
            info: 'elementFillInfoBoldPressed',
            warning: 'elementFillWarningBoldPressed',
            critical: 'elementFillCriticalBoldPressed',
            accentViolet: 'elementFillAccentVioletBoldPressed',
        },
        secondary: {
            brand: 'elementFillBrandSoftPressed',
            neutral: 'elementFillNeutralSoftPressed',
            info: 'elementFillInfoSoftPressed',
            warning: 'elementFillWarningSoftPressed',
            critical: 'elementFillCriticalSoftPressed',
            accentViolet: 'elementFillAccentVioletSoftPressed',
        },
    },
    inverse: {
        primary: {
            brand: 'elementFillOnDarkBrandBoldPressed',
            neutral: 'elementFillOnDarkContrastPressed',
            info: 'elementFillOnDarkInfoBoldPressed',
            warning: 'elementFillOnDarkWarningBoldPressed',
            critical: 'elementFillOnDarkCriticalBoldPressed',
            accentViolet: 'elementFillOnDarkAccentVioletBoldPressed',
        },
        secondary: {
            brand: 'elementFillOnDarkBrandSoftPressed',
            neutral: 'elementFillOnDarkNeutralSoftPressed',
            info: 'elementFillOnDarkInfoSoftPressed',
            warning: 'elementFillOnDarkWarningSoftPressed',
            critical: 'elementFillOnDarkCriticalSoftPressed',
            accentViolet: 'elementFillOnDarkAccentVioletSoftPressed',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

export const buttonSizeToDimensionsMap = {
    small: {
        paddingVertical: nativeSpacings.sp4,
        paddingHorizontal: nativeSpacings.sp10,
        borderRadius: nativeBorders.radii.r8,
    },
    medium: {
        paddingVertical: nativeSpacings.sp8,
        paddingHorizontal: nativeSpacings.sp16,
        borderRadius: 10,
    },
    large: {
        paddingVertical: nativeSpacings.sp10,
        paddingHorizontal: nativeSpacings.sp20,
        borderRadius: nativeBorders.radii.r12,
    },
} as const satisfies Record<
    ButtonSize,
    { paddingVertical: number; paddingHorizontal: number; borderRadius: number }
>;

export const buttonGapMap = {
    small: 0,
    medium: nativeSpacings.sp2,
    large: nativeSpacings.sp4,
} as const satisfies Record<ButtonSize, number>;

export const buttonToTextSizeMap = {
    small: 'body-sm-strong',
    medium: 'body-sm-strong',
    large: 'body-md-strong',
} as const satisfies Record<ButtonSize, TypographyStyle>;

export const buttonToIconSizeMap = {
    small: 'medium',
    medium: 'medium',
    large: 'mediumLarge',
} as const;

export const iconButtonToIconSizeMap = {
    small: 'medium',
    medium: 'medium',
    large: 'mediumLarge',
} as const satisfies Record<ButtonSize, (typeof buttonToIconSizeMap)[ButtonSize]>;

export const iconButtonPaddingMap = {
    small: nativeSpacings.sp6,
    medium: nativeSpacings.sp10,
    large: nativeSpacings.sp12,
} as const satisfies Record<ButtonSize, number>;

export const iconButtonBorderRadiusMap = {
    small: nativeBorders.radii.r8,
    medium: 10,
    large: nativeBorders.radii.r12,
} as const satisfies Record<ButtonSize, number>;

const textButtonColorMap = {
    normal: {
        brand: 'contentBrand',
        info: 'contentInfo',
        warning: 'contentWarning',
        critical: 'contentCritical',
        accentViolet: 'contentAccentViolet',
    },
    inverse: {
        brand: 'contentOnDarkBrand',
        info: 'contentOnDarkInfo',
        warning: 'contentOnDarkWarning',
        critical: 'contentOnDarkCritical',
        accentViolet: 'contentOnDarkAccentViolet',
    },
} as const satisfies Record<InverseKey, Record<FilledButtonIntent, Color>>;

const textButtonNeutralColorMap = {
    normal: {
        primary: 'contentPrimary',
        secondary: 'contentSecondary',
    },
    inverse: {
        primary: 'contentOnDarkPrimary',
        secondary: 'contentOnDarkSecondary',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const textButtonColorMapPressed = {
    normal: {
        brand: 'contentBrandPressed',
        info: 'contentInfoPressed',
        warning: 'contentWarningPressed',
        critical: 'contentCriticalPressed',
        accentViolet: 'contentAccentVioletPressed',
    },
    inverse: {
        brand: 'contentOnDarkBrandPressed',
        info: 'contentOnDarkInfoPressed',
        warning: 'contentOnDarkWarningPressed',
        critical: 'contentOnDarkCriticalPressed',
        accentViolet: 'contentOnDarkAccentVioletPressed',
    },
} as const satisfies Record<InverseKey, Record<FilledButtonIntent, Color>>;

const textButtonNeutralColorMapPressed = {
    normal: {
        primary: 'contentSecondaryPressed',
        secondary: 'contentNeutralPressed',
    },
    inverse: {
        primary: 'contentOnDarkSecondaryPressed',
        secondary: 'contentOnDarkNeutralPressed',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const textButtonDisabledColorMap = {
    normal: 'contentDisabled',
    inverse: 'contentOnDarkDisabled',
} as const satisfies Record<InverseKey, Color>;

type ResolvedButtonColorProps = Required<ButtonColorProps>;

export const getInverseKey = (isInverse: boolean): InverseKey => (isInverse ? 'inverse' : 'normal');

export const getButtonContentColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: ResolvedButtonColorProps & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return colorMapDisabled[inverseKey];
    }

    return colorMap[inverseKey][priority][intent];
};

export const getButtonBackgroundColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: ResolvedButtonColorProps & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return backgroundMapDisabled[inverseKey][priority];
    }

    return backgroundMapBase[inverseKey][priority][intent];
};

export const getButtonPressedBackgroundColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: ResolvedButtonColorProps & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return backgroundMapDisabled[inverseKey][priority];
    }

    return backgroundMapPressed[inverseKey][priority][intent];
};

export const getButtonColors = ({
    intent = 'brand',
    priority = 'primary',
    isDisabled,
    isInverse = false,
}: ButtonColorProps & { isDisabled: boolean }) => {
    const resolvedProps = { intent, priority, isInverse, isDisabled };

    return {
        backgroundColor: getButtonBackgroundColor(resolvedProps),
        onPressColor: getButtonPressedBackgroundColor(resolvedProps),
        contentColor: getButtonContentColor(resolvedProps),
    };
};

export const textButtonGapMap = {
    large: nativeSpacings.sp8,
    small: nativeSpacings.sp6,
} as const satisfies Record<TextButtonSize, number>;

export const textButtonTypographyMap = {
    large: 'body-md',
    small: 'body-sm',
} as const satisfies Record<TextButtonSize, 'body-md' | 'body-sm'>;

export const textButtonIconSizeMap = {
    large: 20,
    small: 16,
} as const satisfies Record<TextButtonSize, number>;

export const getTextButtonDisabledColor = (isInverse: boolean): Color =>
    textButtonDisabledColorMap[getInverseKey(isInverse)];

export const getTextButtonColor = ({
    intent = 'neutral',
    priority = 'primary',
    isInverse = false,
    isPressed,
}: ButtonColorProps & { isPressed: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (intent === 'neutral') {
        return isPressed
            ? textButtonNeutralColorMapPressed[inverseKey][priority]
            : textButtonNeutralColorMap[inverseKey][priority];
    }

    return isPressed
        ? textButtonColorMapPressed[inverseKey][intent]
        : textButtonColorMap[inverseKey][intent];
};
