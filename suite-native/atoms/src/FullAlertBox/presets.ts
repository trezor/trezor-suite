import { type IconName } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

import { type ButtonColorProps } from '../Button/Button';

export const FULL_ALERT_BOX_VARIANTS = [
    'info',
    'critical',
    'neutral',
    'success',
    'warning',
] as const;
export type AlertVariant = (typeof FULL_ALERT_BOX_VARIANTS)[number];

export type FullAlertStyles = {
    backgroundColor: Color;
    borderColor: Color;
    primaryButtonColorProps: ButtonColorProps;
    secondaryButtonColorProps: ButtonColorProps;
};

export const variantToColorMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        borderColor: 'backgroundAlertBlueSubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'info', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation1',
        borderColor: 'backgroundPrimarySubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'brand', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'brand', priority: 'secondary' },
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'warning', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'warning', priority: 'secondary' },
    },
    neutral: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        borderColor: 'backgroundTertiaryDefaultOnElevation0',
        primaryButtonColorProps: { intent: 'brand', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'neutral', priority: 'secondary' },
    },
    critical: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        borderColor: 'backgroundAlertRedSubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
    },
} as const satisfies Record<AlertVariant, FullAlertStyles>;

export const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    critical: 'warning',
    neutral: 'info',
} as const satisfies Record<AlertVariant, IconName>;
