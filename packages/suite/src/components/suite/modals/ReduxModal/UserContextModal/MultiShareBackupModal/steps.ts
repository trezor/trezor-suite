export const steps = [
    'first-info',
    'second-info',
    'verify-ownership',
    'backup-seed',
    'done',
] as const;

export type Steps = (typeof steps)[number];
