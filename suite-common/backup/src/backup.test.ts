import { mockDeviceFeatures } from '@suite-common/suite-types/mocks';

import { hasSlip39Backup, isBackupComplete } from './backup';

describe(isBackupComplete.name, () => {
    test.each([
        { backup_availability: 'NotAvailable' as const, expected: true },
        { backup_availability: 'Available' as const, expected: false },
        { backup_availability: 'Required' as const, expected: false },
    ])(
        'returns $expected for backup_availability=$backup_availability',
        ({ backup_availability, expected }) => {
            expect(isBackupComplete(mockDeviceFeatures({ backup_availability }))).toBe(expected);
        },
    );
});

describe(hasSlip39Backup.name, () => {
    test.each([
        { backup_type: 'Bip39' as const, expected: false },
        { backup_type: 'Slip39_Basic' as const, expected: true },
        { backup_type: 'Slip39_Basic_Extendable' as const, expected: true },
        { backup_type: undefined, expected: false },
    ])('returns $expected for backup_type=$backup_type', ({ backup_type, expected }) => {
        expect(hasSlip39Backup(mockDeviceFeatures({ backup_type }))).toBe(expected);
    });
});
