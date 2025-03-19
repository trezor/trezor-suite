export const wordCounts = [12, 18, 24] as const;
export type WordCount = (typeof wordCounts)[number];

export const recoveryTypes = ['standard', 'advanced'] as const;
export type RecoveryType = (typeof recoveryTypes)[number];
