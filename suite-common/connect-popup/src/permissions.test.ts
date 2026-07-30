import { type PermissionRequest } from '@trezor/connect';

import {
    canonicalizePermissionCoins,
    deriveCardanoEnabledNetworks,
    groupPermissionsByCoin,
    mergePermissions,
    permissionsAreCovered,
    sanitizeRequestedPermissions,
} from './permissions';

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
        const requested = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'not-a-coin' },
        ];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
        ]);
    });

    it('accepts coin symbols in any casing and canonicalizes them to lowercase', () => {
        const requested = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_address', coin: 'tADA' },
        ];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'tada' },
        ]);
    });

    it('drops unknown/garbage permission values', () => {
        const requested = [{ permission: 'read_address', coin: 'btc' }, { permission: 'nonsense' }];
        expect(sanitizeRequestedPermissions(requested, false)).toEqual([
            { permission: 'read_address', coin: 'btc' },
        ]);
    });

    // Nothing schema-validates this on the way in, and a throw here would fail every later call
    // from that app — so every malformed shape has to be dropped instead.
    describe('malformed host input', () => {
        it.each([
            ['a non-array', 'read_address'],
            ['an object instead of an array', { permission: 'read_address' }],
            ['null', null],
            ['a number', 42],
        ])('returns an empty array for %s', (_name, requested) => {
            expect(sanitizeRequestedPermissions(requested, false)).toEqual([]);
        });

        it.each([
            ['null entries', [null]],
            ['undefined entries', [undefined]],
            ['primitive entries', ['read_address', 42]],
            ['entries with no permission', [{ coin: 'btc' }]],
            ['entries whose permission is not a string', [{ permission: 42, coin: 'btc' }]],
            ['entries whose coin is not a string', [{ permission: 'read_address', coin: 5 }]],
            ['entries whose coin is null', [{ permission: 'read_address', coin: null }]],
        ])('drops %s', (_name, requested) => {
            expect(sanitizeRequestedPermissions(requested, false)).toEqual([]);
        });

        it('keeps valid entries alongside malformed ones', () => {
            const requested = [
                null,
                { permission: 'read_address', coin: 'btc' },
                { permission: 'read_xpub', coin: 5 },
                'garbage',
                { permission: 'read_features' },
            ];
            expect(sanitizeRequestedPermissions(requested, false)).toEqual([
                { permission: 'read_address', coin: 'btc' },
                { permission: 'read_features' },
            ]);
        });

        it('does not widen a malformed coin into a device-wide coin-less grant', () => {
            expect(
                sanitizeRequestedPermissions([{ permission: 'sign', coin: null }], false),
            ).toEqual([]);
            expect(sanitizeRequestedPermissions([{ permission: 'sign' }], false)).toEqual([
                { permission: 'sign' },
            ]);
        });

        it('copies only whitelisted fields, dropping attacker-chosen keys', () => {
            const requested = [
                {
                    permission: 'read_address',
                    coin: 'btc',
                    silentMode: true,
                    origin: 'evil.example',
                },
            ];
            expect(sanitizeRequestedPermissions(requested, false)).toEqual([
                { permission: 'read_address', coin: 'btc' },
            ]);
        });
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

    it('de-duplicates by permission and coin, base first', () => {
        const base: PermissionRequest[] = [{ permission: 'read_address', coin: 'btc' }];
        const extra: PermissionRequest[] = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_xpub', coin: 'btc' },
        ];
        expect(mergePermissions(base, extra)).toEqual([
            { permission: 'read_address', coin: 'btc' },
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
        { permission: 'read_address', coin: 'btc' },
        { permission: 'read_features' },
    ];

    it('matches by permission and coin', () => {
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

    // A persisted record can reach this without `allowedPermissions` on native, where the
    // reducer's storageLoad validation never runs (SUITE-NATIVE-4PR).
    it.each([
        ['undefined', undefined],
        ['null', null],
        ['a non-array', 'read_address'],
    ])('is not covered when the granted list is %s', (_name, badGranted) => {
        expect(
            permissionsAreCovered(
                [{ permission: 'read_address', coin: 'btc' }],
                badGranted as unknown as PermissionRequest[],
            ),
        ).toBe(false);
    });

    it('is not covered by an empty granted list, even for an empty request', () => {
        expect(permissionsAreCovered([{ permission: 'read_features' }], [])).toBe(false);
    });
});

describe('groupPermissionsByCoin', () => {
    it('groups by coin with the coin-less group last', () => {
        const groups = groupPermissionsByCoin([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_xpub', coin: 'btc' },
            { permission: 'read_features' },
            { permission: 'sign', coin: 'eth' },
        ]);
        expect(groups).toEqual([
            { coin: 'btc', permissions: ['read_address', 'read_xpub'] },
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

describe('canonicalizePermissionCoins', () => {
    it('lowercases mixed-case coins persisted before canonicalization', () => {
        // Legacy persisted grants kept the mixed-case `coinInfo.shortcut`.
        const legacy = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_xpub', coin: 'tDASH' },
            { permission: 'read_features' },
        ] as unknown as PermissionRequest[];
        expect(canonicalizePermissionCoins(legacy)).toEqual([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_xpub', coin: 'tdash' },
            { permission: 'read_features' },
        ]);
    });

    it('is idempotent on already-canonical coins', () => {
        const canonical: PermissionRequest[] = [
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_features' },
        ];
        expect(canonicalizePermissionCoins(canonical)).toEqual(canonical);
    });
});

describe('deriveCardanoEnabledNetworks', () => {
    it('projects only Cardano grants, de-duplicated', () => {
        const enabled = deriveCardanoEnabledNetworks([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'ada' },
            { permission: 'read_xpub', coin: 'ada' },
            { permission: 'sign', coin: 'tada' },
        ]);
        expect(enabled).toEqual([{ coin: 'ada' }, { coin: 'tada' }]);
    });

    it('returns an empty array when there are no Cardano grants', () => {
        expect(deriveCardanoEnabledNetworks([{ permission: 'read_address', coin: 'btc' }])).toEqual(
            [],
        );
    });
});
