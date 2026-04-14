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
        backgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertBlueSubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'info', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
    },
    success: {
        backgroundColor: 'legacyBackgroundPrimarySubtleOnElevation1',
        borderColor: 'legacyBackgroundPrimarySubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'brand', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'brand', priority: 'secondary' },
    },
    warning: {
        backgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertYellowSubtleOnElevationNegative',
        primaryButtonColorProps: { intent: 'warning', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'warning', priority: 'secondary' },
    },
    neutral: {
        backgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
        borderColor: 'legacyBackgroundTertiaryDefaultOnElevation0',
        primaryButtonColorProps: { intent: 'brand', priority: 'primary' },
        secondaryButtonColorProps: { intent: 'neutral', priority: 'secondary' },
    },
    critical: {
        backgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
        borderColor: 'legacyBackgroundAlertRedSubtleOnElevationNegative',
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
