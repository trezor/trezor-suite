import { mockDeviceFeatures } from '@suite-common/suite-types/mocks';

import { doesSupportMultiShare } from './shamir';

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
