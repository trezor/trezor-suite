import { type IconName } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

import { type ButtonColorProps } from '../Button/Button';

export const INLINE_ALERT_BOX_VARIANTS = [
    'info',
    'critical',
    'neutral',
    'success',
    'warning',
] as const;
export type InlineAlertBoxVariant = (typeof INLINE_ALERT_BOX_VARIANTS)[number];

export type InlineAlertBoxStyles = {
    backgroundColor: Color;
    borderColor: Color;
    buttonColorProps: ButtonColorProps;
};

export const variantToColorMap = {
    info: {
        backgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertBlueSubtleOnElevationNegative',
        buttonColorProps: { intent: 'info', priority: 'primary' },
    },
    success: {
        backgroundColor: 'legacyBackgroundPrimarySubtleOnElevation1',
        borderColor: 'legacyBackgroundPrimarySubtleOnElevationNegative',
        buttonColorProps: { intent: 'brand', priority: 'primary' },
    },
    warning: {
        backgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertYellowSubtleOnElevationNegative',
        buttonColorProps: { intent: 'warning', priority: 'primary' },
    },
    neutral: {
        backgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
        borderColor: 'legacyBackgroundTertiaryDefaultOnElevation0',
        buttonColorProps: { intent: 'brand', priority: 'primary' },
    },
    critical: {
        backgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertRedSubtleOnElevationNegative',
        buttonColorProps: { intent: 'critical', priority: 'primary' },
    },
} as const satisfies Record<InlineAlertBoxVariant, InlineAlertBoxStyles>;

export const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    critical: 'warning',
    neutral: 'info',
} as const satisfies Record<InlineAlertBoxVariant, IconName>;
