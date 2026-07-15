import { mockDeviceFeatures } from '@suite-common/suite-types/mocks';

import { doesSupportMultiShare, isAdditionalShamirBackupInProgress } from './shamir';

describe(doesSupportMultiShare.name, () => {
    test.each([
        {
            desc: 'Capability_Shamir + extendable backup',
            capabilities: ['Capability_Shamir' as const],
            backup_type: 'Slip39_Basic_Extendable' as const,
            expected: true,
        },
        {
            desc: 'no Capability_Shamir',
            capabilities: [],
            backup_type: 'Slip39_Basic_Extendable' as const,
            expected: false,
        },
        {
            desc: 'Capability_Shamir + non-extendable backup',
            capabilities: ['Capability_Shamir' as const],
            backup_type: 'Bip39' as const,
            expected: false,
        },
        {
            desc: 'undefined capabilities',
            capabilities: undefined,
            backup_type: 'Slip39_Basic_Extendable' as const,
            expected: false,
        },
    ])('returns $expected when $desc', ({ capabilities, backup_type, expected }) => {
        expect(doesSupportMultiShare(mockDeviceFeatures({ capabilities, backup_type }))).toBe(
            expected,
        );
    });
});

describe(isAdditionalShamirBackupInProgress.name, () => {
    test.each([
        {
            desc: 'in backup recovery with available backup',
            recovery_status: 'Backup' as const,
            recovery_type: undefined,
            backup_availability: 'Available' as const,
            expected: true,
        },
        {
            desc: 'recovery_status is not Backup',
            recovery_status: 'Recovery' as const,
            recovery_type: undefined,
            backup_availability: 'Available' as const,
            expected: false,
        },
        {
            desc: 'recovery_type is set',
            recovery_status: 'Backup' as const,
            recovery_type: 'DryRun' as const,
            backup_availability: 'Available' as const,
            expected: false,
        },
        {
            desc: 'backup is not available',
            recovery_status: 'Backup' as const,
            recovery_type: undefined,
            backup_availability: 'NotAvailable' as const,
            expected: false,
        },
    ])(
        'returns $expected when $desc',
        ({ recovery_status, recovery_type, backup_availability, expected }) => {
            expect(
                isAdditionalShamirBackupInProgress(
                    mockDeviceFeatures({ recovery_status, recovery_type, backup_availability }),
                ),
            ).toBe(expected);
        },
    );
});
