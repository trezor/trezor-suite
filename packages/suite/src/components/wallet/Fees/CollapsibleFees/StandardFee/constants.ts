import { type TranslationKey } from '@suite/intl';
import { type FeeLevel } from '@trezor/connect';

export const feeLevelTranslationMap = {
    custom: 'FEE_LEVEL_ADVANCED',
    high: 'FEE_LEVEL_HIGH',
    normal: 'FEE_LEVEL_NORMAL',
    economy: 'FEE_LEVEL_LOW',
    low: 'FEE_LEVEL_LOW',
} as const satisfies Record<FeeLevel['label'], TranslationKey>;
