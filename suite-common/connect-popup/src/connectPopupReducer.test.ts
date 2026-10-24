import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupInitialState, prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
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

    it('does not remember permissions for a desktop app whose process is unknown', () => {
        expect(rememberApps({ ...app, process: UNKNOWN_PROCESS }).permissions).toEqual([]);
    });

    // A path the main process read as blank identifies the caller no better than UNKNOWN_PROCESS
    // does, yet such a grant is remembered, and `isSameConnectApp` — which tells callers apart by
    // `fullPath` alone — matches it against every other blank-path caller of the same origin. The
    // test documents that behaviour before it is changed.
    it.each(['', '   '])(
        'remembers permissions for a desktop app whose process path is %p',
        fullPath => {
            const blankPath = { ...app, process: { ...appProcess, fullPath } };

            expect(rememberApps(blankPath).permissions).toEqual([blankPath]);
        },
    );
});

describe('storageLoad', () => {
    const loadApps = (...apps: AppRememberedPermission[]) =>
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

    it('loads permissions remembered for a blank process path', () => {
        const blankPath = { ...app, process: { ...appProcess, fullPath: '' } };

        expect(loadApps(blankPath).permissions).toEqual([blankPath]);
    });
});
