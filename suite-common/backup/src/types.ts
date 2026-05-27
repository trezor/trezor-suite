export type AdditionalBackupPhase = 'verify-ownership' | 'backup';

export type AdditionalBackupResult =
    | { success: true }
    | { success: false; phase: AdditionalBackupPhase };
