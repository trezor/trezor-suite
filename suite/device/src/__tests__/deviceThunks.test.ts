import reduxMockStore, { MockStoreCreator } from 'redux-mock-store';
import { withExtraArgument } from 'redux-thunk';

import { routerReducer } from '@suite/router';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import type { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock, filterThunkActionTypes } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';

import disconnectDeviceThunkFixture from '../__fixtures__/deviceThunks';
import { disconnectDeviceThunk } from '../deviceThunks';

const EMPTY_ACTION = { type: 'foo' };
const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);

const getInitialState = (state?: {
    device?: Partial<ReturnType<typeof deviceReducer>>;
    router?: Partial<ReturnType<typeof routerReducer>>;
}) => ({
    device: {
        ...deviceReducer(undefined, EMPTY_ACTION),
        ...state?.device,
    },
    router: {
        ...routerReducer(undefined, EMPTY_ACTION),
        ...state?.router,
    },
});

const configureStore = <S, DispatchExts = {}>(
    additionalExtraDeps: Partial<ExtraDependencies> = {},
): MockStoreCreator<S, DispatchExts> =>
    reduxMockStore([
        withExtraArgument({
            ...extraDependenciesCommonMock,
            ...additionalExtraDeps,
        }),
    ]);

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { device, router } = store.getState();
        store.getState().device = deviceReducer(device, action);
        store.getState().router = routerReducer(router, action);
        store.getActions().push(action);
    });

    return store;
};

describe('disconnectDeviceThunk', () => {
    disconnectDeviceThunkFixture.forEach(f => {
        it(`disconnectDeviceThunk: ${f.description}`, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);

            store.dispatch({
                type: DEVICE.DISCONNECT,
                payload: f.device,
            });
            await store.dispatch(disconnectDeviceThunk(f.device));

            const actions = filterThunkActionTypes(store.getActions());

            if (!f.result) {
                expect(actions.pop()?.type).toEqual(deviceActions.deviceDisconnect.type);
            } else {
                const action = actions.pop();

                if (f.result.type) {
                    expect(action?.type).toEqual(f.result.type);
                }
                expect(action?.payload).toEqual(f.result.payload);
            }
        });
    });
});
