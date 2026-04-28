import type { PROTO } from '@trezor/connect';

import { hasNonWordlistBackup, isBackupComplete } from '../backupUtils';

const mockFeatures = (overrides: Partial<PROTO.Features>): PROTO.Features =>
    ({
        backup_availability: 'Required',
        backup_type: null,
        ...overrides,
    }) as PROTO.Features;

describe('isBackupComplete', () => {
    it('returns true when backup_availability is NotAvailable', () => {
        expect(isBackupComplete(mockFeatures({ backup_availability: 'NotAvailable' }))).toBe(true);
    });

    it('returns false when backup_availability is Required', () => {
        expect(isBackupComplete(mockFeatures({ backup_availability: 'Required' }))).toBe(false);
    });

    it('returns false when backup_availability is Available', () => {
        expect(isBackupComplete(mockFeatures({ backup_availability: 'Available' }))).toBe(false);
    });
});

describe('hasNonWordlistBackup', () => {
    it('returns false when backup_type is null', () => {
        expect(hasNonWordlistBackup(mockFeatures({ backup_type: null }))).toBe(false);
    });

    it('returns false when backup_type is Bip39', () => {
        expect(hasNonWordlistBackup(mockFeatures({ backup_type: 'Bip39' }))).toBe(false);
    });

    it('returns true for Slip39 backup types', () => {
        const slip39Types = [
            'Slip39_Basic',
            'Slip39_Advanced',
            'Slip39_Single_Extendable',
            'Slip39_Basic_Extendable',
            'Slip39_Advanced_Extendable',
        ] as const;

        slip39Types.forEach(backupType => {
            expect(hasNonWordlistBackup(mockFeatures({ backup_type: backupType }))).toBe(true);
        });
    });
});
