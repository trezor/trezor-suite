import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE } from '@suite-actions/constants';
import { FIRMWARE } from '@firmware-actions/constants';
import firmwareReducer from '@firmware-reducers/firmwareReducer';
import routerReducer from '@suite-reducers/routerReducer';
import modalReducer from '@suite-reducers/modalReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import firmwareMiddleware from '@firmware-middlewares/firmwareMiddleware';

const { getSuiteDevice } = global.JestMocks;

const middlewares = [firmwareMiddleware];

type FirmwareState = ReturnType<typeof firmwareReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

const getInitialState = (
    router?: Partial<RouterState>,
    firmware?: Partial<FirmwareState>,
    suite?: Partial<SuiteState>,
) => ({
    firmware: {
        ...firmwareReducer(undefined, { type: FIRMWARE.RESET_REDUCER }),
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
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([thunk, ...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, suite } = store.getState();
        // @ts-ignore
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().suite = suiteReducer(suite, action);

        store.getActions().push(action);
    });
    return store;
};

describe('firmware middleware', () => {
    it('if status === "unplug" disconnecting device results in status "reconnect-in-normal"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
                error: undefined,
            }),
        );
        await store.dispatch({ type: SUITE.UPDATE_SELECTED_DEVICE, payload: undefined });

        const result = store.getActions();
        expect(result).toEqual([
            { type: SUITE.UPDATE_SELECTED_DEVICE, payload: undefined },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'reconnect-in-normal' },
        ]);
    });

    it('if status === "unplug" disconnecting SAVED device results in status "reconnect-in-normal"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
                error: undefined,
            }),
        );
        await store.dispatch({
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: getSuiteDevice({ connected: false }),
        });

        const result = store.getActions();
        expect(result).toEqual([
            { type: SUITE.UPDATE_SELECTED_DEVICE, payload: getSuiteDevice({ connected: false }) },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'reconnect-in-normal' },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "done" if firmware === valid', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'valid', connected: true }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            {
                type: SUITE.SELECT_DEVICE,
                payload: getSuiteDevice({ firmware: 'valid', connected: true }),
            },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'done' },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "partially-done" if firmware === outdated', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'outdated', connected: true }),
        });

        const result = store.getActions();

        expect(result).toEqual([
            {
                type: SUITE.SELECT_DEVICE,
                payload: getSuiteDevice({ firmware: 'outdated', connected: true }),
            },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'partially-done' },
        ]);
    });

    it('SELECT.DEVICE do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({ firmware: 'none' }),
        });
    });

    it('FIRMWARE.SET_UPDATE_STATUS -> FIRMWARE.SET_TARGET_RELEASE', async () => {
        const store = initStore(
            getInitialState(
                undefined,
                {
                    status: 'check-seed',
                    error: undefined,
                },
                {
                    device: getSuiteDevice(),
                },
            ),
        );

        await store.dispatch({
            type: FIRMWARE.SET_UPDATE_STATUS,
            payload: 'waiting-for-bootloader',
        });

        const result = store.getActions();
        result.shift();
        expect(result[0].type).toEqual(FIRMWARE.SET_TARGET_RELEASE);
    });
});
