import { type Color } from '@trezor/theme';

import { type DotIntent } from './types';

const intentToBackgroundColorMap: Record<DotIntent, Color> = {
    brand: 'elementFillBrandBold',
    neutral: 'elementFillNeutralBold',
    info: 'elementFillInfoBold',
    warning: 'elementFillWarningBold',
    critical: 'elementFillCriticalBold',
    accentViolet: 'elementFillAccentVioletBold',
};

export const mapIntentToBackgroundColor = (intent: DotIntent): Color =>
    intentToBackgroundColorMap[intent];
