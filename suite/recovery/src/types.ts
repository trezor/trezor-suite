export const wordCounts = [12, 18, 24] as const;
export type WordCount = (typeof wordCounts)[number];

export const recoveryInputTypes = ['standard', 'advanced'] as const;
export type RecoveryInputType = (typeof recoveryInputTypes)[number];

export type SeedInputStatus =
    | 'initial'
    | 'select-word-count'
    | 'select-recovery-type'
    | 'waiting-for-confirmation'
    | 'in-progress'
    | 'finished';
