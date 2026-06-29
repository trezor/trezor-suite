import { type IconName } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

import { type AlertBoxIntent } from './types';

export type AlertBoxStyles = {
    backgroundColor: Color;
    borderColor: Color;
    textColor: Color;
};

export const intentToColorMap = {
    brand: {
        backgroundColor: 'elementFillBrandSofter',
        borderColor: 'elementBorderBrandSofter',
        textColor: 'contentBrand',
    },
    neutral: {
        backgroundColor: 'elementFillNeutralSofter',
        borderColor: 'elementBorderNeutralSofter',
        textColor: 'contentPrimary',
    },
    critical: {
        backgroundColor: 'elementFillCriticalSofter',
        borderColor: 'elementBorderCriticalSofter',
        textColor: 'contentCritical',
    },

    warning: {
        backgroundColor: 'elementFillWarningSofter',
        borderColor: 'elementBorderWarningSofter',
        textColor: 'contentWarning',
    },
    info: {
        backgroundColor: 'elementFillInfoSofter',
        borderColor: 'elementBorderInfoSofter',
        textColor: 'contentInfo',
    },
} as const satisfies Record<AlertBoxIntent, AlertBoxStyles>;

export const intentToIconName = {
    info: 'info',
    brand: 'checkCircle',
    warning: 'warning',
    critical: 'warningCircle',
    neutral: 'info',
} as const satisfies Record<AlertBoxIntent, IconName>;
