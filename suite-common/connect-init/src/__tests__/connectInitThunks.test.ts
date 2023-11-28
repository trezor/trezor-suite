import { configureMockStore, extraDependenciesMock, testMocks } from '@suite-common/test-utils';
import { BLOCKCHAIN_EVENT, DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT } from '@trezor/connect';

import { connectInitThunk } from '../connectInitThunks';

describe('TrezorConnect Actions', () => {
    let store = configureMockStore();

    beforeEach(() => {
        store = configureMockStore();
    });

    it('Success', async () => {
        console.warn(testMocks.getTrezorConnectMock().setTestFixtures);
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
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
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
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
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
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
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
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        expect(actions.pop()).toMatchObject({ type: connectInitThunk.pending.type });
        emitTestEvent(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.pop()).toEqual({ type: DEVICE_EVENT });
        emitTestEvent(UI_EVENT, { type: UI_EVENT });
        expect(actions.pop()).toEqual({ type: UI_EVENT });
        emitTestEvent(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.pop()).toEqual({ type: TRANSPORT_EVENT });
        emitTestEvent(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        testMocks.setTrezorConnectFixtures();
        await store.dispatch(connectInitThunk());
        await testMocks.getTrezorConnectMock().getFeatures();
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
