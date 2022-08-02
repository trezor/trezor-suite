/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createAction } from '@reduxjs/toolkit';

import { DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT } from '@trezor/connect';

import { prepareConnectInitThunk } from '../slice';

const initSettings = {
    transportReconnect: true,
    debug: false,
    popup: false,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

const MOCK_LOCK_DEVICE_ACTION = 'MOCK_LOCK_DEVICE_ACTION';

const init = prepareConnectInitThunk({
    actions: {
        lockDevice: createAction<boolean>(MOCK_LOCK_DEVICE_ACTION),
    },
    selectors: {
        selectEnabledNetworks: () => [],
        selectIsPendingTransportEvent: () => true,
    },
    initSettings: {
        ...initSettings,
    },
});

jest.mock('@trezor/connect', () => {
    let fixture: any;
    const callbacks: { [key: string]: (e: any) => any } = {};
    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => {
                if (typeof fixture === 'function') throw fixture();
                return true;
            },
            on: (event: string, cb: (e: any) => any) => {
                callbacks[event] = cb;
            },
            getFeatures: () => ({
                success: true,
            }),
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        // custom method for test purpose
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        emit: (event: string, data: any) => {
            callbacks[event].call(undefined, {
                event,
                ...data,
            });
        },
    };
});

const mockStore = configureStore([thunk]);

describe('TrezorConnect Actions', () => {
    let store = mockStore({});

    beforeEach(() => {
        store = mockStore({});
    });

    it('Success', async () => {
        await store.dispatch(init());
        const expectedActions = [
            {
                type: init.pending.type,
            },
            {
                type: init.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
            })),
        ).toEqual(expectedActions);
    });

    it('Error', async () => {
        const errorFixture = new Error('Iframe error');
        require('@trezor/connect').setTestFixtures(() => errorFixture);
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: init.pending.type,
            },
            {
                type: init.rejected.type,
                error: errorFixture.message,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('TypedError', async () => {
        const errorFixture = {
            message: 'Iframe error',
            code: 'SomeCode',
        };
        require('@trezor/connect').setTestFixtures(() => errorFixture);
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: init.pending.type,
            },
            {
                type: init.rejected.type,
                error: `${errorFixture.code}: ${errorFixture.message}`,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('Error as string', async () => {
        const errorFixture = 'Iframe error';
        require('@trezor/connect').setTestFixtures(() => errorFixture);
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: init.pending.type,
            },
            {
                type: init.rejected.type,
                error: errorFixture,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('Events', async () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        await store.dispatch(init());

        const expectedActions = [
            {
                type: init.pending.type,
            },
            {
                type: init.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
            })),
        ).toEqual(expectedActions);

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { emit } = require('@trezor/connect');

        emit(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(store.getActions().pop()).toEqual({ type: DEVICE_EVENT });
        emit(UI_EVENT, { type: UI_EVENT });
        expect(store.getActions().pop()).toEqual({ type: UI_EVENT });
        emit(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(store.getActions().pop()).toEqual({ type: TRANSPORT_EVENT });
        emit(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(store.getActions().pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        await store.dispatch(init());
        await require('@trezor/connect').default.getFeatures();
        const actions = store.getActions();
        // check actions in reversed order
        expect(actions.pop()).toEqual({
            type: MOCK_LOCK_DEVICE_ACTION,
            payload: false,
        });
        expect(actions.pop()).toEqual({
            type: MOCK_LOCK_DEVICE_ACTION,
            payload: true,
        });
    });
});
