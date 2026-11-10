import { type BackupType } from '@suite-common/suite-types';

const SHAMIR_TYPES: BackupType[] = ['shamir-single', 'shamir-advanced'];

export const isShamirBackupType = (type: BackupType) => SHAMIR_TYPES.includes(type);
