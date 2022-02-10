/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mergeObject } from '@trezor/utils';
import { init } from '@suite-actions/trezorConnectActions';
import { SUITE } from '@suite-actions/constants';
import { BACKUP } from '@backup-actions/constants';
import * as backupActions from '@backup-actions/backupActions';

jest.mock('trezor-connect', () => {
    let fixture: any;

    const backupDevice = () => fixture;
    const callbacks: { [key: string]: () => any } = {};

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
                },
            },
            locks: [3],
        },
        // doesnt affect anything, just needed for TrezorConnect.init action
        devices: [],
        wallet: {
            settings: {
                cardanoDerivationType: {
                    label: 'Icarus',
                    value: 1,
                },
                enabledNetworks: ['btc'],
            },
        },
    };
    if (override) {
        return mergeObject(defaults, override);
    }
    return defaults;
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

describe('Backup Actions', () => {
    it('backup success', async () => {
        require('trezor-connect').setTestFixtures({ success: true });

        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(init());

        await store.dispatch(backupActions.backupDevice({ device: store.getState().suite.device }));
        // discard @suite/trezor-connect-initialized action we don't care about it in this test
        store.getActions().shift();

        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toMatchObject({
            type: '@notification/toast',
            payload: { type: 'backup-success' },
        });
    });

    it('backup error', async () => {
        require('trezor-connect').setTestFixtures({
            success: false,
            payload: { error: 'avadakedavra' },
        });

        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(init());

        await store.dispatch(backupActions.backupDevice({ device: store.getState().suite.device }));
        // discard @suite/trezor-connect-initialized action we don't care about it in this test
        store.getActions().shift();

        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toMatchObject({
            type: '@notification/toast',
            payload: { type: 'backup-failed' },
        });
    });
});
