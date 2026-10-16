import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupInitialState, prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
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

describe('rememberAppPermissions', () => {
    const appProcess = { name: 'App', fullPath: '/usr/bin/app', warning: false };
    const app: AppRememberedPermission = {
        type: CALL_SOURCE_DESKTOP_WS,
        origin: 'https://example.com',
        process: appProcess,
        manifest: { appName: 'App' },
        allowedPermissions: [{ permission: 'read_address' }],
    };

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
});
