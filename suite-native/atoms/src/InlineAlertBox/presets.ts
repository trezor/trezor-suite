import { IconName } from '@suite-native/icons';
import { Color } from '@trezor/theme';

import { ButtonColorScheme } from '../Button/Button';

export type InlineAlertBoxVariant = 'info' | 'critical' | 'neutral' | 'success' | 'warning';

export type InlineAlertBoxStyles = {
    backgroundColor: Color;
    borderColor: Color;
    buttonColorScheme: ButtonColorScheme;
};

export const variantToColorMap = {
    info: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        borderColor: 'backgroundAlertBlueSubtleOnElevationNegative',
        buttonColorScheme: 'blueBold',
    },
    success: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation1',
        borderColor: 'backgroundPrimarySubtleOnElevationNegative',
        buttonColorScheme: 'primary',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
        buttonColorScheme: 'yellowBold',
    },
    neutral: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        borderColor: 'backgroundTertiaryDefaultOnElevation0',
        buttonColorScheme: 'primary',
    },
    critical: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        borderColor: 'backgroundAlertRedSubtleOnElevationNegative',
        buttonColorScheme: 'redBold',
    },
} as const satisfies Record<InlineAlertBoxVariant, InlineAlertBoxStyles>;

export const variantToIconName = {
    info: 'info',
    success: 'checkCircle',
    warning: 'warning',
    critical: 'warning',
    neutral: 'info',
} as const satisfies Record<InlineAlertBoxVariant, IconName>;
