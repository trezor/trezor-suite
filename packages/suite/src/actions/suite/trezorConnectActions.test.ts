import { debugInitialState } from '@suite/debug';
import { prepareDesktopDeviceReducer } from '@suite/device';
import { lockDevice } from '@suite/locks';
import { suiteSettingsInitialState } from '@suite/settings';
import { connectInitThunk } from '@suite-common/connect-init';
import { deviceReducerInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { BLOCKCHAIN_EVENT, DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT } from '@trezor/connect';

import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';

import { extraDependenciesDesktopMock } from '../../../mocks/extraDependenciesDesktopMock';

const deviceReducer = prepareDesktopDeviceReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
const getInitialState = (suite?: Partial<SuiteState>, device?: Partial<DevicesState>) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    suiteSettings: suiteSettingsInitialState,
    debug: debugInitialState,
    device: {
        ...deviceReducerInitialState,
        devices: device?.devices || [],
        isConnectionModalOpen: false,
        defaultConnectionMode: 'cable' as 'cable' | 'bluetooth',
    },
    wallet: {
        settings: {
            enabledNetworks: [],
        },
    },
    messageSystem: messageSystemInitialState,
    firmware: { firmwareChannel: 'production' },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = (preloadedState: State) =>
    configureMockStore({
        extra: extraDependenciesDesktopMock,
        reducer: (state = preloadedState, action) => ({
            ...state,
            suite: suiteReducer(state.suite, action),
            device: deviceReducer(state.device, action),
        }),
        preloadedState,
    });

describe('TrezorConnect Actions', () => {
    it('Success', () => {
        const state = getInitialState();
        const store = mockStore(state);
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();
    });

    it('Error', async () => {
        testMocks.setTrezorConnectFixtures(() => {
            throw new Error('Iframe error');
        });
        const state = getInitialState();
        const store = mockStore(state);
        try {
            await store.dispatch(connectInitThunk()).unwrap();
            throw new Error('Unreachable!');
        } catch (error) {
            expect(error.message).toEqual('Iframe error');
        }
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState();
        const store = mockStore(state);
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();

        const actions = store.getActions();
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

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
        const state = getInitialState();
        const store = mockStore(state);
        await store.dispatch(connectInitThunk());
        await testMocks.getTrezorConnectMock().getFeatures();
        const actions = store.getActions();
        // check actions in reversed order
        expect(actions.pop()).toMatchObject({
            type: '@suite/device/removeButtonRequests',
        });
        expect(actions.pop()).toEqual({
            type: lockDevice.type,
            payload: false,
        });
        expect(actions.pop()).toEqual({
            type: lockDevice.type,
            payload: true,
        });
    });
});
