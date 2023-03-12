/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

import { configureStore } from '@suite/support/tests/configureStore';
import { mergeDeepObject } from '@trezor/utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { SUITE } from '@suite-actions/constants';
import { BACKUP } from '@backup-actions/constants';
import * as backupActions from '@backup-actions/backupActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { CommonParams } from '@trezor/connect';
import { DeviceModel } from '@trezor/device-utils';

jest.mock('@trezor/connect', () => {
    let fixture: any;

    const backupDevice = () => fixture;
    const callbacks: { [key: string]: () => any } = {};

    const { PROTO } = jest.requireActual('@trezor/connect');

    return {
        __esModule: true, // this property makes it work
        default: {
            init: () => true,
            on: (event: string, cb: () => any) => {
                callbacks[event] = cb;
            },
            getFeatures: () => {},
            backupDevice,
            blockchainSetCustomBackend: () => {},
        },
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        PROTO,
    };
});

export const getInitialState = (override: any) => {
    const defaults = {
        suite: {
            device: {
                connected: true,
                type: 'acquired',
                features: {
                    major_version: 2,
                    model: DeviceModel.TT,
                },
            },
            locks: [3],
            settings: { debug: {} },
        },
        // doesnt affect anything, just needed for TrezorConnect.init action
        devices: [],
        wallet: {
            settings: {
                enabledNetworks: ['btc'],
            },
        },
    };
    if (override) {
        return mergeDeepObject(defaults, override);
    }
    return defaults;
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>();

describe('Backup Actions', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('backup success', async () => {
        require('@trezor/connect').setTestFixtures({ success: true });

        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(connectInitThunk());

        await store.dispatch(
            backupActions.backupDevice({ device: store.getState().suite.device } as CommonParams),
        );

        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.pending.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.fulfilled.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toMatchObject({
            type: notificationsActions.addToast.type,
            payload: { type: 'backup-success' },
        });
    });

    it('backup error', async () => {
        require('@trezor/connect').setTestFixtures({
            success: false,
            payload: { error: 'avadakedavra' },
        });

        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(connectInitThunk());

        await store.dispatch(
            backupActions.backupDevice({ device: store.getState().suite.device } as CommonParams),
        );

        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.pending.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.fulfilled.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toMatchObject({
            type: notificationsActions.addToast.type,
            payload: { type: 'backup-failed' },
        });
    });
});
