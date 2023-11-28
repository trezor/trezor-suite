import { deviceActions } from '@suite-common/wallet-core';
import { connectInitThunk } from '@suite-common/connect-init';
import { UI_EVENT, UI } from '@trezor/connect';
import { testMocks } from '@suite-common/test-utils';

import { configureStore } from 'src/support/tests/configureStore';
import { SUITE } from 'src/actions/suite/constants';
import routerReducer from 'src/reducers/suite/routerReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import suiteMiddleware from 'src/middlewares/suite/suiteMiddleware';
import buttonRequestMiddleware from 'src/middlewares/suite/buttonRequestMiddleware';
import { Action } from 'src/types/suite';

const { getSuiteDevice } = testMocks;

const device = getSuiteDevice();

export const getInitialState = () => ({
    router: routerReducer(undefined, { type: 'foo' } as any),
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
    },
    wallet: {
        settings: {
            enabledNetworks: [],
        },
    },
    device: {
        devices: [device],
        selectedDevice: device,
    },
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>([suiteMiddleware, buttonRequestMiddleware]);
    const store = mockStore(state);
    return store;
};

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const store = initStore(getInitialState());
        await store.dispatch(connectInitThunk());
        const call = store.dispatch(deviceSettingsActions.changePin({ remove: false }));
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        // fake few ui events, just like when user is changing PIN
        emitTestEvent(UI_EVENT, {
            type: UI.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        emitTestEvent(UI_EVENT, {
            type: UI.REQUEST_PIN,
            payload: { type: 'PinMatrixRequestType_NewFirst', device },
        });

        await call;

        // not interested in the last action (its from changePin mock);
        store.getActions().pop();
        expect(store.getActions()).toMatchObject([
            { type: connectInitThunk.pending.type, payload: undefined },
            { type: connectInitThunk.fulfilled.type, payload: undefined },
            { type: SUITE.LOCK_DEVICE, payload: true },
            { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_ProtectCall' } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'ButtonRequest_ProtectCall' }, device },
            },
            { type: UI.REQUEST_PIN, payload: { type: 'PinMatrixRequestType_NewFirst', device } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'PinMatrixRequestType_NewFirst' }, device },
            },
            { type: SUITE.LOCK_DEVICE, payload: false },
            { type: deviceActions.addButtonRequest.type, payload: { device } },
        ]);
    });
});
