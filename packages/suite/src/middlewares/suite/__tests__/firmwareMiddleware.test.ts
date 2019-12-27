import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE } from '@suite-actions/constants';
import { FIRMWARE } from '@settings-actions/constants';
import { DEVICE } from 'trezor-connect';
import firmwareReducer from '@suite-reducers/firmwareReducer';
import routerReducer from '@suite-reducers/routerReducer';
import modalReducer from '@suite-reducers/modalReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import firmwareMiddleware from '@suite-middlewares/firmwareMiddleware';

const { getConnectDevice, getSuiteDevice } = global.JestMocks;

const middlewares = [firmwareMiddleware];

type FirmwareState = ReturnType<typeof firmwareReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

export const getInitialState = (
    router?: Partial<RouterState>,
    firmware?: Partial<FirmwareState>,
    suite?: Partial<SuiteState>,
) => {
    return {
        firmware: {
            ...firmwareReducer(undefined, { type: 'foo' } as any),
            ...firmware,
        },
        router: {
            ...routerReducer(undefined, { type: 'foo' } as any),
            ...router,
        },
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
        modal: modalReducer(undefined, { type: 'foo' } as any),
    };
};

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([thunk, ...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, suite } = store.getState();
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().suite = suiteReducer(suite, action);

        store.getActions().push(action);
    });
    return store;
};

describe('firmware middleware', () => {
    it('if status of firmware install process is error, disconnecting device triggers reset of firmware reducer', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'error',
            }),
        );
        await store.dispatch({ type: DEVICE.DISCONNECT, payload: getConnectDevice() });

        const result = store.getActions();
        expect(result).toEqual([
            { type: DEVICE.DISCONNECT, payload: getConnectDevice() },
            { type: FIRMWARE.RESET_REDUCER },
        ]);
    });

    it('the same happens for status "done"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'done',
            }),
        );
        await store.dispatch({ type: DEVICE.DISCONNECT, payload: getConnectDevice() });

        const result = store.getActions();
        expect(result).toEqual([
            { type: DEVICE.DISCONNECT, payload: getConnectDevice() },
            { type: FIRMWARE.RESET_REDUCER },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "done" if firmware === valid', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'valid' }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            { type: SUITE.SELECT_DEVICE, payload: getSuiteDevice({ firmware: 'valid' }) },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'done' },
            { type: SUITE.LOCK_UI, payload: false },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "partially-done" if firmware === outdated', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'outdated' }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            { type: SUITE.SELECT_DEVICE, payload: getSuiteDevice({ firmware: 'outdated' }) },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'partially-done' },
            { type: SUITE.LOCK_UI, payload: false },
        ]);
    });

    it('SELECT.DEVICE do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'started',
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'outdated' }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            { type: SUITE.SELECT_DEVICE, payload: getSuiteDevice({ firmware: 'outdated' }) },
        ]);
    });

    it('SELECT.DEVICE do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'none' }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            { type: SUITE.SELECT_DEVICE, payload: getSuiteDevice({ firmware: 'none' }) },
        ]);
    });

    it('DEVICE.DISCONNECT do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'started',
            }),
        );

        await store.dispatch({
            type: DEVICE.DISCONNECT,
            payload: getConnectDevice(),
        });

        const result = store.getActions();
        result.pop();
        expect(result).toEqual([]);
    });
});
