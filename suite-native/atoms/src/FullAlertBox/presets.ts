import { IconName } from '@suite-native/icons';
import { Color } from '@trezor/theme';

import { ButtonColorScheme } from '../Button/Button';
export type AlertVariant = 'info' | 'critical' | 'neutral' | 'success' | 'warning';

export type FullAlertStyles = {
    backgroundColor: Color;
    borderColor: Color;
    primaryButtonColorScheme: ButtonColorScheme;
    secondaryButtonColorScheme: ButtonColorScheme;
};

export const variantToColorMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        borderColor: 'backgroundAlertBlueSubtleOnElevationNegative',
        primaryButtonColorScheme: 'blueBold',
        secondaryButtonColorScheme: 'blueElevation0',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation1',
        borderColor: 'backgroundPrimarySubtleOnElevationNegative',
        primaryButtonColorScheme: 'primary',
        secondaryButtonColorScheme: 'primaryElevation0',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
        primaryButtonColorScheme: 'yellowBold',
        secondaryButtonColorScheme: 'yellowElevation0',
    },
    neutral: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        borderColor: 'backgroundTertiaryDefaultOnElevation0',
        primaryButtonColorScheme: 'primary',
        secondaryButtonColorScheme: 'tertiaryElevation0',
    },
    critical: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        borderColor: 'backgroundAlertRedSubtleOnElevationNegative',
        primaryButtonColorScheme: 'redBold',
        secondaryButtonColorScheme: 'redElevation0',
    },
} as const satisfies Record<AlertVariant, FullAlertStyles>;

export const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    critical: 'warning',
    neutral: 'info',
} as const satisfies Record<AlertVariant, IconName>;
