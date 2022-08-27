/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { BLOCKCHAIN_EVENT, DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT } from '@trezor/connect';

import { connectInitThunk } from '../connectInitThunks';

jest.mock('@trezor/connect', () => {
    let fixture: any;
    const callbacks: { [key: string]: (e: any) => any } = {};
    return {
        ...jest.requireActual('@trezor/connect'),
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

describe('TrezorConnect Actions', () => {
    let store = configureMockStore();

    beforeEach(() => {
        store = configureMockStore();
    });

    it('Success', async () => {
        await store.dispatch(connectInitThunk());
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.fulfilled.type,
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
        await store.dispatch(connectInitThunk());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
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
        await store.dispatch(connectInitThunk());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
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
        await store.dispatch(connectInitThunk());
        require('@trezor/connect').setTestFixtures(undefined);
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
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

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();

        const actions = store.getActions();
        const { emit } = require('@trezor/connect');

        expect(actions.pop()).toMatchObject({ type: connectInitThunk.pending.type });
        emit(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.pop()).toEqual({ type: DEVICE_EVENT });
        emit(UI_EVENT, { type: UI_EVENT });
        expect(actions.pop()).toEqual({ type: UI_EVENT });
        emit(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.pop()).toEqual({ type: TRANSPORT_EVENT });
        emit(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        await store.dispatch(connectInitThunk());
        await require('@trezor/connect').default.getFeatures();
        const actions = store.getActions();
        // check actions in reversed order
        expect(actions.pop()).toEqual({
            type: extraDependenciesMock.actions.lockDevice.type,
            payload: false,
        });
        expect(actions.pop()).toEqual({
            type: extraDependenciesMock.actions.lockDevice.type,
            payload: true,
        });
    });
});
