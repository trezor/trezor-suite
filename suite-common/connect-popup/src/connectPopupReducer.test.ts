import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import {
    connectPopupInitialState,
    prepareConnectPopupReducer,
    selectIsConnectAppSilentModeByOrigin,
} from './connectPopupReducer';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WALLETCONNECT,
    UNKNOWN_PROCESS,
} from './connectPopupTypes';

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const rememberApps = (...apps: AppRememberedPermission[]) =>
    apps.reduce(
        (state, payload) =>
            connectPopupReducer(state, connectPopupActions.rememberAppPermissions(payload)),
        connectPopupInitialState,
    );

const appProcess = { name: 'App', fullPath: '/usr/bin/app', warning: false };
const app: AppRememberedPermission = {
    type: CALL_SOURCE_DESKTOP_WS,
    origin: 'https://example.com',
    process: appProcess,
    manifest: { appName: 'App' },
    allowedPermissions: [{ permission: 'read_address' }],
};

describe('rememberAppPermissions', () => {
    it.each<[string, AppRememberedPermission]>([
        [
            'another process',
            {
                ...app,
                process: { ...appProcess, fullPath: '/usr/bin/other' },
                allowedPermissions: [{ permission: 'sign' }],
            },
        ],
        [
            'another source type',
            { ...app, type: CALL_SOURCE_MCP, allowedPermissions: [{ permission: 'sign' }] },
        ],
    ])(
        'replaces, never extends, the permissions remembered for %s of the same origin',
        (_, otherApp) => {
            expect(rememberApps(app, otherApp).permissions).toEqual([otherApp]);
        },
    );

    it('does not remember permissions for an app with the origin null', () => {
        expect(rememberApps({ ...app, origin: 'null' }).permissions).toEqual([]);
    });

    it.each(['*', '', 'https://*.example.com', ' https://example.com', 'myapp://'])(
        'does not remember permissions for an app whose origin %p is not established',
        origin => {
            expect(rememberApps({ ...app, origin }).permissions).toEqual([]);
        },
    );

    it('does not remember permissions for a desktop app whose process is unknown', () => {
        expect(rememberApps({ ...app, process: UNKNOWN_PROCESS }).permissions).toEqual([]);
    });

    it('does not remember permissions for a walletconnect app', () => {
        expect(
            rememberApps({ ...app, type: CALL_SOURCE_WALLETCONNECT, process: undefined })
                .permissions,
        ).toEqual([]);
    });

    it.each(['', '   '])(
        'does not remember permissions for a desktop app whose process path is %p',
        fullPath => {
            expect(
                rememberApps({ ...app, process: { ...appProcess, fullPath } }).permissions,
            ).toEqual([]);
        },
    );
});

describe('storageLoad', () => {
    // Persisted grants are not validated, so a test may hand over any shape.
    const loadApps = (...apps: unknown[]) =>
        connectPopupReducer(connectPopupInitialState, {
            type: mockActionType('storageLoad'),
            payload: { connect: { permissions: apps } },
        });

    it('loads remembered permissions', () => {
        expect(loadApps(app).permissions).toEqual([app]);
    });

    it('does not load permissions remembered for the origin null by an earlier version', () => {
        expect(loadApps({ ...app, origin: 'null' }).permissions).toEqual([]);
    });

    // The audit's stale grant: a remembered permission stored for an unattributed caller would be
    // matched by any later call that also arrives without an origin.
    it.each(['*', '', 'https://*.example.com', ' https://example.com', 'myapp://'])(
        'does not load permissions remembered for the unestablished origin %p',
        origin => {
            expect(loadApps({ ...app, origin }).permissions).toEqual([]);
        },
    );

    // An earlier version assigned the origin of a handshake message to the web link unchecked, so a
    // message without one left the caller with no origin at all: `undefined`, which a grant kept
    // as it was or dropped as a missing key, depending on how it was persisted.
    it.each<[string, unknown]>([
        ['an undefined origin', { ...app, origin: undefined }],
        [
            'no origin at all',
            Object.fromEntries(Object.entries(app).filter(([key]) => key !== 'origin')),
        ],
        ['a null origin', { ...app, origin: null }],
        ['an origin that is not a string', { ...app, origin: 42 }],
    ])('does not load permissions remembered with %s by an earlier version', (_, persisted) => {
        expect(loadApps(persisted).permissions).toEqual([]);
    });

    it('keeps loading the grants it can use next to one it drops', () => {
        const dropped = { ...app, origin: undefined };
        const kept = { ...app, origin: 'https://other.example' };

        expect(loadApps(dropped, app, kept).permissions).toEqual([app, kept]);
    });

    it('does not load permissions remembered for walletconnect by an earlier version', () => {
        expect(
            loadApps({ ...app, type: CALL_SOURCE_WALLETCONNECT, process: undefined }).permissions,
        ).toEqual([]);
    });

    it('does not load permissions remembered for a blank process path by an earlier version', () => {
        expect(loadApps({ ...app, process: { ...appProcess, fullPath: '' } }).permissions).toEqual(
            [],
        );
    });

    // Nothing schema-validates the persisted grants, so a `process` without a path must be
    // dropped like any other malformed entry — a throw here would abort the store hydration.
    it('does not load a permission whose persisted process has no path', () => {
        const withoutPath = { ...app, process: { name: 'App' } } as unknown;

        expect(loadApps(withoutPath as AppRememberedPermission).permissions).toEqual([]);
    });
});

describe('selectIsConnectAppSilentModeByOrigin', () => {
    const selectSilentMode = (origin: string | undefined, ...apps: AppRememberedPermission[]) =>
        selectIsConnectAppSilentModeByOrigin(
            { connectPopup: { ...connectPopupInitialState, permissions: apps } },
            origin,
        );

    it('is silent for the origin of an app remembered in silent mode', () => {
        expect(selectSilentMode(app.origin, { ...app, silentMode: true })).toBe(true);
    });

    it('is not silent for another origin or for an app that is not in silent mode', () => {
        expect(selectSilentMode('https://other.example', { ...app, silentMode: true })).toBe(false);
        expect(selectSilentMode(app.origin, { ...app, silentMode: false })).toBe(false);
    });

    // Such a grant is never remembered, but the selector must not depend on that: the same
    // origin would otherwise be silent for every unattributed caller.
    it.each(['*', 'null', 'https://*.example.com'])(
        'is not silent for the unestablished origin %p, even for a grant stored under it',
        origin => {
            expect(selectSilentMode(origin, { ...app, origin, silentMode: true })).toBe(false);
        },
    );

    it('is not silent when the call has no origin', () => {
        expect(selectSilentMode(undefined, { ...app, silentMode: true })).toBe(false);
    });
});
