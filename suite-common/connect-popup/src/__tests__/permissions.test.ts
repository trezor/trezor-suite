import { type PermissionRequest } from '@trezor/connect';

import {
    deriveCardanoEnabledNetworks,
    groupPermissionsByCoin,
    mergePermissions,
    permissionsAreCovered,
    sanitizeRequestedPermissions,
} from '../permissions';

describe('sanitizeRequestedPermissions', () => {
    it('returns an empty array for undefined input', () => {
        expect(sanitizeRequestedPermissions(undefined, false)).toEqual([]);
    });

    it('drops permissions that are never grantable to a 3rd party', () => {
        const requested: PermissionRequest[] = [
            { permission: 'management' },
            { permission: 'internal' },
            { permission: 'read_address', coin: 'btc' },
        ];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
        ]);
    });

    it('drops push_tx only on deeplink sources', () => {
        const requested: PermissionRequest[] = [{ permission: 'push_tx', coin: 'btc' }];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'push_tx', coin: 'btc' },
        ]);
        expect(sanitizeRequestedPermissions(requested, true)).toEqual([]);
    });

    it('drops entries whose coin is not a known coin symbol', () => {
        const requested: PermissionRequest[] = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'not-a-coin' },
        ];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
        ]);
    });

    it('accepts coin symbols regardless of casing', () => {
        const requested: PermissionRequest[] = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_address', coin: 'tADA' },
        ];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual(requested);
    });

    it('drops unknown/garbage permission values', () => {
        const requested = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'nonsense' },
        ] as unknown as PermissionRequest[];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
        ]);
    });
});

describe('mergePermissions', () => {
    it('unions two lists, base first', () => {
        const base: PermissionRequest[] = [{ permission: 'sign', coin: 'eth' }];
        const extra: PermissionRequest[] = [{ permission: 'read_address', coin: 'btc' }];
        expect(mergePermissions(base, extra)).toEqual([
            { permission: 'sign', coin: 'eth' },
            { permission: 'read_address', coin: 'btc' },
        ]);
    });

    it('de-duplicates by permission and coin case-insensitively, keeping the base casing', () => {
        const base: PermissionRequest[] = [{ permission: 'read_address', coin: 'BTC' }];
        const extra: PermissionRequest[] = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_xpub', coin: 'btc' },
        ];
        expect(mergePermissions(base, extra)).toEqual([
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_xpub', coin: 'btc' },
        ]);
    });

    it('treats coin-less permissions as distinct from coin-scoped ones', () => {
        const merged = mergePermissions(
            [{ permission: 'read_features' }],
            [{ permission: 'read_features' }, { permission: 'read_xpub' }],
        );
        expect(merged).toEqual([{ permission: 'read_features' }, { permission: 'read_xpub' }]);
    });
});

describe('permissionsAreCovered', () => {
    const granted: PermissionRequest[] = [
        { permission: 'read_address', coin: 'BTC' },
        { permission: 'read_features' },
    ];

    it('matches coins case-insensitively', () => {
        expect(permissionsAreCovered([{ permission: 'read_address', coin: 'btc' }], granted)).toBe(
            true,
        );
    });

    it('covers coin-less permissions', () => {
        expect(permissionsAreCovered([{ permission: 'read_features' }], granted)).toBe(true);
    });

    it('is not covered when a permission is missing', () => {
        expect(permissionsAreCovered([{ permission: 'sign', coin: 'btc' }], granted)).toBe(false);
    });

    it('is not covered when the coin differs', () => {
        expect(permissionsAreCovered([{ permission: 'read_address', coin: 'eth' }], granted)).toBe(
            false,
        );
    });
});

describe('groupPermissionsByCoin', () => {
    it('groups by coin (case-insensitively) with the coin-less group last', () => {
        const groups = groupPermissionsByCoin([
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_xpub', coin: 'btc' },
            { permission: 'read_features' },
            { permission: 'sign', coin: 'eth' },
        ]);
        expect(groups).toEqual([
            { coin: 'BTC', permissions: ['read_address', 'read_xpub'] },
            { coin: 'eth', permissions: ['sign'] },
            { permissions: ['read_features'] },
        ]);
    });

    it('de-duplicates permissions within a group', () => {
        const groups = groupPermissionsByCoin([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'btc' },
        ]);
        expect(groups).toEqual([{ coin: 'btc', permissions: ['read_address'] }]);
    });
});

describe('deriveCardanoEnabledNetworks', () => {
    it('projects only Cardano grants, lowercased and de-duplicated', () => {
        const enabled = deriveCardanoEnabledNetworks([
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_address', coin: 'ADA' },
            { permission: 'read_xpub', coin: 'ada' },
            { permission: 'sign', coin: 'tADA' },
        ]);
        expect(enabled).toEqual([{ coin: 'ada' }, { coin: 'tada' }]);
    });

    it('returns an empty array when there are no Cardano grants', () => {
        expect(deriveCardanoEnabledNetworks([{ permission: 'read_address', coin: 'btc' }])).toEqual(
            [],
        );
    });
});
