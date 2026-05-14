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
        buttonColorProps: { intent: 'info', priority: 'secondary' },
    },
    success: {
        backgroundColor: 'legacyBackgroundPrimarySubtleOnElevation1',
        borderColor: 'legacyBackgroundPrimarySubtleOnElevationNegative',
        buttonColorProps: { intent: 'brand', priority: 'secondary' },
    },
    warning: {
        backgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertYellowSubtleOnElevationNegative',
        buttonColorProps: { intent: 'warning', priority: 'secondary' },
    },
    neutral: {
        backgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
        borderColor: 'legacyBackgroundTertiaryDefaultOnElevation0',
        buttonColorProps: { intent: 'neutral', priority: 'secondary' },
    },
    critical: {
        backgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertRedSubtleOnElevationNegative',
        buttonColorProps: { intent: 'critical', priority: 'secondary' },
    },
} as const satisfies Record<InlineAlertBoxVariant, InlineAlertBoxStyles>;

export const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    critical: 'warning',
    neutral: 'info',
} as const satisfies Record<InlineAlertBoxVariant, IconName>;
