import { type PermissionRequest } from '@trezor/connect';

import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WALLETCONNECT,
    CALL_SOURCE_WEB,
    type ConnectCallSource,
    UNKNOWN_PROCESS,
} from './connectPopupTypes';
import {
    canProcessCall,
    canRememberPermissions,
    canonicalizePermissionCoins,
    deriveCardanoEnabledNetworks,
    groupPermissionsByCoin,
    isEstablishedOrigin,
    isSameConnectApp,
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

    it('is not covered when a legacy persisted record has no granted list', () => {
        const legacyGranted = undefined as unknown as PermissionRequest[];

        expect(permissionsAreCovered([{ permission: 'read_features' }], legacyGranted)).toBe(false);
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

describe('canRememberPermissions', () => {
    const manifest = { appName: 'App' };

    it.each<[string, ConnectCallSource]>([
        ['a web app', { type: CALL_SOURCE_WEB, origin: 'https://example.com', manifest }],
        ['a deeplink', { type: CALL_SOURCE_DEEPLINK, origin: 'example://app', manifest }],
        [
            'a desktop process',
            {
                type: CALL_SOURCE_DESKTOP_WS,
                origin: 'https://example.com',
                process: { name: 'App', fullPath: '/usr/bin/app', warning: false },
                manifest,
            },
        ],
        [
            'an mcp client whose process was resolved',
            {
                type: CALL_SOURCE_MCP,
                origin: 'mcp://localhost',
                process: { name: 'App', fullPath: '/usr/bin/app', warning: false },
                manifest,
            },
        ],
    ])('remembers permissions for %s', (_, source) => {
        expect(canRememberPermissions(source)).toBe(true);
    });

    it.each<[string, ConnectCallSource]>([
        [
            'walletconnect, whose consent lives in its own session',
            { type: CALL_SOURCE_WALLETCONNECT, origin: 'https://example.com', manifest },
        ],
        [
            'the origin null that every sandboxed or local page sends',
            { type: CALL_SOURCE_WEB, origin: 'null', manifest },
        ],
        [
            'the wildcard origin a message carries before it is attributed to a caller',
            { type: CALL_SOURCE_WEB, origin: '*', manifest },
        ],
        ['an empty origin', { type: CALL_SOURCE_WEB, origin: '', manifest }],
        [
            'a wildcard origin that only looks like a host',
            { type: CALL_SOURCE_WEB, origin: 'https://*.example.com', manifest },
        ],
        [
            'a deeplink whose callback URL has no host, which leaves its scheme alone',
            { type: CALL_SOURCE_DEEPLINK, origin: 'myapp://', manifest },
        ],
        [
            'a desktop app whose process is unknown',
            {
                type: CALL_SOURCE_DESKTOP_WS,
                origin: 'https://example.com',
                process: UNKNOWN_PROCESS,
                manifest,
            },
        ],
        [
            // Every MCP caller shares the one constant origin, so one without a process would
            // inherit the grant of the next caller Suite could not identify either.
            'an mcp client whose process stayed unresolved',
            { type: CALL_SOURCE_MCP, origin: 'mcp://localhost', manifest },
        ],
        [
            'an mcp client whose process has no path to be told apart by',
            {
                type: CALL_SOURCE_MCP,
                origin: 'mcp://localhost',
                process: { name: 'Claude Code', fullPath: '', warning: true },
                manifest,
            },
        ],
    ])('does not remember permissions for %s', (_, source) => {
        expect(canRememberPermissions(source)).toBe(false);
    });
});

describe('canProcessCall', () => {
    const manifest = { appName: 'App' };

    it.each(['https://example.com', 'http://127.0.0.1:21325'])(
        'processes a web call from the established origin %s',
        origin => {
            expect(canProcessCall({ type: CALL_SOURCE_WEB, origin, manifest })).toBe(true);
        },
    );

    it.each(['', '*', 'null', 'https://*.example.com', ' https://example.com'])(
        'refuses a web call whose origin %p is not established',
        origin => {
            expect(canProcessCall({ type: CALL_SOURCE_WEB, origin, manifest })).toBe(false);
        },
    );

    // The `Origin` header of a desktop WebSocket call is passed on as it is: a page that sends the
    // literal `null` or `*` gets past the main process, which drops only a missing one.
    describe('a desktop call', () => {
        const appProcess = { name: 'App', fullPath: '/usr/bin/app', warning: false };

        it.each(['https://example.com', 'http://127.0.0.1:21325'])(
            'is processed from the established origin %s',
            origin => {
                expect(
                    canProcessCall({
                        type: CALL_SOURCE_DESKTOP_WS,
                        origin,
                        process: appProcess,
                        manifest,
                    }),
                ).toBe(true);
            },
        );

        it.each(['', '*', 'null', 'https://*.example.com'])(
            'is refused when its origin %p is not established',
            origin => {
                expect(
                    canProcessCall({
                        type: CALL_SOURCE_DESKTOP_WS,
                        origin,
                        process: appProcess,
                        manifest,
                    }),
                ).toBe(false);
            },
        );

        // Not the origin, but the process tells a desktop caller apart: an unknown one is asked
        // about every time and never remembered, which is a different decision from this one.
        it('is processed from an established origin when its process is unknown', () => {
            expect(
                canProcessCall({
                    type: CALL_SOURCE_DESKTOP_WS,
                    origin: 'https://example.com',
                    process: UNKNOWN_PROCESS,
                    manifest,
                }),
            ).toBe(true);
        });
    });

    // MCP names its caller by one constant origin, and a deeplink by the scheme and host of its
    // callback URL: a call whose origin is still not established is asked about every time and never
    // remembered. WalletConnect's origin may be empty for an unverified dapp, which its own session
    // consent covers.
    it.each<[string, ConnectCallSource]>([
        ['a deeplink', { type: CALL_SOURCE_DEEPLINK, origin: 'example://app', manifest }],
        [
            'a deeplink whose callback URL has no host',
            { type: CALL_SOURCE_DEEPLINK, origin: 'myapp://', manifest },
        ],
        ['an mcp client', { type: CALL_SOURCE_MCP, origin: 'mcp://localhost', manifest }],
        [
            'a walletconnect dapp WC could not verify',
            { type: CALL_SOURCE_WALLETCONNECT, origin: '', manifest },
        ],
    ])('does not gate %s on its origin', (_, source) => {
        expect(canProcessCall(source)).toBe(true);
    });
});

describe('isEstablishedOrigin', () => {
    it.each([
        'https://example.com',
        'http://127.0.0.1:21325',
        'example://app',
        'mcp://localhost',
        // The webextension link names its caller by the bare extension id.
        'abcdefghijklmnopabcdefghijklmnop',
    ])('accepts the caller origin %s', origin => {
        expect(isEstablishedOrigin(origin)).toBe(true);
    });

    it.each(['null', '*', '', '  ', undefined, null, 42])('rejects %p', origin => {
        expect(isEstablishedOrigin(origin)).toBe(false);
    });

    it.each(['https://*', 'https://*.example.com', '*.example.com', 'https://example.com/*'])(
        'rejects the origin %s, a wildcard is not a caller even as a part of an origin',
        origin => {
            expect(isEstablishedOrigin(origin)).toBe(false);
        },
    );

    // The origin is stored and compared as it is, so a padded one would never equal the caller's own.
    it.each([' https://example.com', 'https://example.com ', '\thttps://example.com\n'])(
        'rejects the padded origin %p',
        origin => {
            expect(isEstablishedOrigin(origin)).toBe(false);
        },
    );

    // What a deeplink callback URL without a host leaves of its origin: every callback of the same
    // scheme would share it.
    it.each(['myapp://', 'file://', 'https://'])(
        'rejects the origin %s, a scheme alone is not a caller',
        origin => {
            expect(isEstablishedOrigin(origin)).toBe(false);
        },
    );
});

describe('isSameConnectApp', () => {
    const manifest = { appName: 'App' };
    const app: ConnectCallSource = {
        type: CALL_SOURCE_WEB,
        origin: 'https://example.com',
        manifest,
    };

    it('matches the same caller', () => {
        expect(isSameConnectApp(app, { ...app })).toBe(true);
    });

    it('does not match another origin', () => {
        expect(isSameConnectApp(app, { ...app, origin: 'https://other.example' })).toBe(false);
    });

    // A grant stored for an unattributed caller would otherwise be shared by every site that also
    // arrives without an origin — the wildcard matches everything, including itself.
    it.each(['*', '', 'null', 'https://*.example.com', ' https://example.com', 'myapp://'])(
        'does not match the unestablished origin %p, even against itself',
        origin => {
            const unattributed = { ...app, origin };

            expect(isSameConnectApp(unattributed, unattributed)).toBe(false);
            expect(isSameConnectApp(unattributed, app)).toBe(false);
            expect(isSameConnectApp(app, unattributed)).toBe(false);
        },
    );
});
