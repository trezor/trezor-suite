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
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        borderColor: 'backgroundAlertBlueSubtleOnElevationNegative',
        buttonColorProps: { intent: 'info', priority: 'primary' },
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation1',
        borderColor: 'backgroundPrimarySubtleOnElevationNegative',
        buttonColorProps: { intent: 'brand', priority: 'primary' },
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
        buttonColorProps: { intent: 'warning', priority: 'primary' },
    },
    neutral: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        borderColor: 'backgroundTertiaryDefaultOnElevation0',
        buttonColorProps: { intent: 'brand', priority: 'primary' },
    },
    critical: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        borderColor: 'backgroundAlertRedSubtleOnElevationNegative',
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
