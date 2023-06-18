import { configureStore } from 'src/support/tests/configureStore';

import { SUITE } from 'src/actions/suite/constants';
import { FIRMWARE } from 'src/actions/firmware/constants';
import firmwareReducer from 'src/reducers/firmware/firmwareReducer';
import routerReducer from 'src/reducers/suite/routerReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import firmwareMiddleware from 'src/middlewares/firmware/firmwareMiddleware';

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
    analytics: {
        enabled: false,
    },
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, suite } = store.getState();
        // @ts-expect-error
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().suite = suiteReducer(suite, action);

        store.getActions().push(action);
    });
    return store;
};

jest.mock('@trezor/suite-analytics', () => global.JestMocks.getAnalytics());
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('firmware middleware', () => {
    it('if status === "unplug" disconnecting device results in status "reconnect-in-normal"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
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
                firmwareChallenge: '123',
                firmwareHash: '345',
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

    it('SELECT.DEVICE if in wait-for-reboot -> changes status to "started" if intermediaryInstalled === true', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                intermediaryInstalled: true,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );

        await store.dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({
                mode: 'bootloader',
                connected: true,
            }),
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: SUITE.SELECT_DEVICE,
                payload: getSuiteDevice({ connected: true, mode: 'bootloader' }),
            },
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "validation" if firmware === valid', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
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
            { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'validation' },
        ]);
    });

    it('SELECT.DEVICE do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
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
                    firmwareChallenge: '123',
                    firmwareHash: '345',
                },
                {
                    device: getSuiteDevice(),
                },
            ),
        );

        await store.dispatch({
            type: FIRMWARE.SET_UPDATE_STATUS,
            payload: 'waiting-for-bootloader',
            firmwareChallenge: '123',
            firmwareHash: '345',
        });

        const result = store.getActions();
        result.shift();
        expect(result[0].type).toEqual(FIRMWARE.SET_TARGET_RELEASE);
    });
});
