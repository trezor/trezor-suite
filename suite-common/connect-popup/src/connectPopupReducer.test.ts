import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupInitialState, prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectCallSource,
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

    it('does not remember permissions for a walletconnect app', () => {
        expect(
            rememberApps({ ...app, type: CALL_SOURCE_WALLETCONNECT, process: undefined })
                .permissions,
        ).toEqual([]);
    });
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

    it('does not load permissions remembered for walletconnect by an earlier version', () => {
        expect(
            loadApps({ ...app, type: CALL_SOURCE_WALLETCONNECT, process: undefined }).permissions,
        ).toEqual([]);
    });
});

describe('refuseConnectV9Call', () => {
    const { allowedPermissions: _allowedPermissions, ...appSource } = app;

    const deeplinkSource: ConnectCallSource = {
        type: CALL_SOURCE_DEEPLINK,
        origin: 'myapp://callback',
        manifest: { appName: 'App' },
        isConnectV9: true,
        isConnectV9Certain: true,
    };

    const refuseCall = (
        state: ReturnType<typeof connectPopupReducer>,
        source: ConnectCallSource,
        method: 'getAddress' | 'getPublicKey' = 'getAddress',
    ) =>
        connectPopupReducer(
            state,
            connectPopupActions.refuseConnectV9Call({
                method,
                payload: {},
                source,
                error: { code: 'Method_NotAllowed', message: 'Update to Connect 10.' },
            }),
        );

    it('shows the first declined call of an app', () => {
        expect(refuseCall(connectPopupInitialState, appSource).activeCall).toMatchObject({
            state: 'call-error',
            method: 'getAddress',
            isConnectV9Refusal: true,
            error: { message: 'Update to Connect 10.' },
        });
    });

    it('declines the next call of the same app without showing it again', () => {
        const state = refuseCall(
            refuseCall(connectPopupInitialState, appSource),
            appSource,
            'getPublicKey',
        );

        expect(state.activeCall).toMatchObject({ method: 'getAddress' });
    });

    it('declines a call of an app whose error has been closed without showing it', () => {
        const shown = refuseCall(connectPopupInitialState, appSource);
        const closed = connectPopupReducer(
            connectPopupReducer(shown, connectPopupActions.finishCall()),
            connectPopupActions.clearCall(),
        );

        expect(refuseCall(closed, appSource).activeCall).toBeUndefined();
    });

    it('shows every declined deeplink call, because each one opened Suite', () => {
        const state = refuseCall(
            refuseCall(connectPopupInitialState, deeplinkSource),
            deeplinkSource,
            'getPublicKey',
        );

        expect(state.activeCall).toMatchObject({
            state: 'call-error',
            method: 'getPublicKey',
            isConnectV9Refusal: true,
        });
    });

    it('parks the callback URL on a declined deeplink call instead of answering it right away', () => {
        const declined = refuseCall(connectPopupInitialState, deeplinkSource);
        const state = connectPopupReducer(
            declined,
            connectPopupActions.deeplinkCallback({ callbackUrl: 'myapp://callback?id=12' }),
        );

        expect(state.activeCall).toMatchObject({
            state: 'call-error',
            callbackUrl: 'myapp://callback?id=12',
        });
    });
});
