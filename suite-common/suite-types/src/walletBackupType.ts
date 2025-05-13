export const selectBackupTypes = [
    'shamir-single',
    'shamir-advanced',
    '12-words',
    '24-words',
] as const;

export type BackupType = (typeof selectBackupTypes)[number];
