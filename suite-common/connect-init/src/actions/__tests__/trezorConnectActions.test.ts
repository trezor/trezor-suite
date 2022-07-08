/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createAction } from '@reduxjs/toolkit';

import { DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT } from '@trezor/connect';

import { prepareConnectInit } from '../prepareConnectInit';

const initSettings = {
    transportReconnect: true,
    debug: false,
    popup: false,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

const MOCK_CONNECT_INIT_ERROR_ACTION = 'MOCK_CONNECT_INIT_ERROR_ACTION';
const MOCK_LOCK_DEVICE_ACTION = 'MOCK_LOCK_DEVICE_ACTION';
const MOCK_CONNECT_INITIALIZED_ACTION = 'MOCK_CONNECT_INITIALIZED_ACTION';

const init = () =>
    prepareConnectInit({
        actions: {
            lockDevice: createAction<boolean>(MOCK_LOCK_DEVICE_ACTION),
            setInitConnectError: createAction<
                (payload: string) => { payload: undefined; error: string },
                string
            >(MOCK_CONNECT_INIT_ERROR_ACTION, (payload: string) => ({
                payload: undefined,
                error: payload,
            })),
            onConnectInitialized: createAction(MOCK_CONNECT_INITIALIZED_ACTION),
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
                type: prepareConnectInit.pending.type,
            },
            {
                type: MOCK_CONNECT_INITIALIZED_ACTION,
            },
            {
                type: prepareConnectInit.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
            })),
        ).toEqual(expectedActions);
    });

    it('Error', async () => {
        require('@trezor/connect').setTestFixtures(() => new Error('Iframe error'));
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: prepareConnectInit.pending.type,
            },
            {
                type: MOCK_CONNECT_INIT_ERROR_ACTION,
                error: 'Iframe error',
            },
            {
                type: prepareConnectInit.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action.error,
            })),
        ).toEqual(expectedActions);
    });

    it('TypedError', async () => {
        require('@trezor/connect').setTestFixtures(() => ({
            message: 'Iframe error',
            code: 'SomeCode',
        }));
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: prepareConnectInit.pending.type,
            },
            {
                type: MOCK_CONNECT_INIT_ERROR_ACTION,
                error: 'SomeCode: Iframe error',
            },
            {
                type: prepareConnectInit.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action.error,
            })),
        ).toEqual(expectedActions);
    });

    it('Error as string', async () => {
        require('@trezor/connect').setTestFixtures(() => 'Iframe error');
        await store.dispatch(init());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: prepareConnectInit.pending.type,
            },
            {
                type: MOCK_CONNECT_INIT_ERROR_ACTION,
                error: 'Iframe error',
            },
            {
                type: prepareConnectInit.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action.error,
            })),
        ).toEqual(expectedActions);
    });

    it('Events', async () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        await store.dispatch(init());
        const expectedActions = [
            {
                type: prepareConnectInit.pending.type,
            },
            {
                type: MOCK_CONNECT_INITIALIZED_ACTION,
            },
            {
                type: prepareConnectInit.fulfilled.type,
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
