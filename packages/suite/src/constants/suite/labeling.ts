import { typedObjectValues } from '@trezor/utils';

export type LabelingSelectValue = 'off' | 'secure-sync' | 'legacy';

export type LabelingOption = { label: string; value: LabelingSelectValue };

export const LABELING_SELECT_OPTIONS_MAP: Record<LabelingSelectValue, LabelingOption> = {
    off: { label: 'Off', value: 'off' },
    'secure-sync': { label: 'Secure sync (recommended)', value: 'secure-sync' },
    legacy: { label: 'Legacy', value: 'legacy' },
};

export const LABELING_SELECT_OPTIONS = typedObjectValues(LABELING_SELECT_OPTIONS_MAP);
