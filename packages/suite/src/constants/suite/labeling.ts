import { type TranslationKey } from '@suite/intl';
import { typedObjectValues } from '@trezor/utils';

export type LabelingSelectValue = 'off' | 'suite-sync' | 'legacy';

export type LabelingOption<T> = { label: T; value: LabelingSelectValue };
export type LabelingOptionTranslated = LabelingOption<TranslationKey>;

export const LABELING_SELECT_OPTIONS_MAP: Record<
    LabelingSelectValue,
    LabelingOption<TranslationKey>
> = {
    off: { label: 'TR_LABELING_OFF', value: 'off' },
    'suite-sync': { label: 'TR_LABELING_SECURE_SYNC', value: 'suite-sync' },
    legacy: { label: 'TR_LABELING_LEGACY', value: 'legacy' },
};

export const LABELING_LEGACY_OPTION_LABEL = 'TR_LABELING_ON';

export const LABELING_SELECT_OPTIONS = typedObjectValues(LABELING_SELECT_OPTIONS_MAP);
