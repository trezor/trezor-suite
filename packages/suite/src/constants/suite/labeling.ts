import { ActionSelectOption } from 'src/components/suite/section/sectionStyles';

export const LABELING_OPTIONS: Record<string, ActionSelectOption> = {
    ON: { label: 'On', value: 'on' } as const,
    OFF: { label: 'Off', value: 'off' } as const,
    SECURE_SYNC: { label: 'Secure sync (recommended)', value: 'secure-sync' } as const,
    LEGACY: { label: 'Legacy', value: 'legacy' } as const,
} as const;

export const LABELING_SELECT_OPTIONS: ActionSelectOption[] = [
    LABELING_OPTIONS.ON,
    LABELING_OPTIONS.OFF,
];
export const EXPERIMENT_LABELING_SELECT_OPTIONS: ActionSelectOption[] = [
    LABELING_OPTIONS.SECURE_SYNC,
    LABELING_OPTIONS.LEGACY,
    LABELING_OPTIONS.OFF,
];
