import { type PROTO } from '@trezor/connect';

export const EXTENDABLE_SHAMIR_BACKUP_TYPES: PROTO.BackupType[] = [
    'Slip39_Single_Extendable',
    'Slip39_Basic_Extendable',
    'Slip39_Advanced_Extendable',
];
