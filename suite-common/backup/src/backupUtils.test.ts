import { type PROTO } from '@trezor/connect';

import { hasNonWordlistBackup, isBackupComplete } from './backupUtils';

const makeFeatures = (overrides: Partial<PROTO.Features> = {}): PROTO.Features =>
    ({
        backup_type: undefined,
        backup_availability: undefined,
        ...overrides,
    }) as unknown as PROTO.Features;

describe(isBackupComplete.name, () => {
    it('returns true when backup_availability is NotAvailable', () => {
        expect(isBackupComplete(makeFeatures({ backup_availability: 'NotAvailable' }))).toBe(true);
    });

    it('returns false when backup_availability is Available', () => {
        expect(isBackupComplete(makeFeatures({ backup_availability: 'Available' }))).toBe(false);
    });

    it('returns false when backup_availability is Required', () => {
        expect(isBackupComplete(makeFeatures({ backup_availability: 'Required' }))).toBe(false);
    });
});

describe(hasNonWordlistBackup.name, () => {
    it('returns false for Bip39', () => {
        expect(hasNonWordlistBackup(makeFeatures({ backup_type: 'Bip39' }))).toBe(false);
    });

    it('returns true for Slip39_Basic', () => {
        expect(hasNonWordlistBackup(makeFeatures({ backup_type: 'Slip39_Basic' }))).toBe(true);
    });

    it('returns true for Slip39_Basic_Extendable', () => {
        expect(hasNonWordlistBackup(makeFeatures({ backup_type: 'Slip39_Basic_Extendable' }))).toBe(
            true,
        );
    });

    it('returns false when backup_type is null', () => {
        expect(hasNonWordlistBackup(makeFeatures({ backup_type: null as any }))).toBe(false);
    });

    it('returns false when backup_type is undefined', () => {
        expect(hasNonWordlistBackup(makeFeatures({ backup_type: undefined }))).toBe(false);
    });
});
