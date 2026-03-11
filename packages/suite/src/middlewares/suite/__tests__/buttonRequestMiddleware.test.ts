import { lockDevice } from '@suite/locks';
import { routerReducer } from '@suite/router';
import { connectInitThunk } from '@suite-common/connect-init';
import { deviceActions } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock, testMocks } from '@suite-common/test-utils';
import { UI_EVENT, UI_REQUEST } from '@trezor/connect';

import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import buttonRequestMiddleware from 'src/middlewares/suite/buttonRequestMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { Action, Dispatch } from 'src/types/suite';

const device = mockSuiteDevice();

const getInitialState = () => ({
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
    messageSystem: messageSystemInitialState,
    firmware: { firmwareChannel: 'production' },
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>([
        prepareSuiteMiddleware(() => extraDependenciesCommonMock),
        buttonRequestMiddleware,
    ]);
    const store = mockStore(state);

    return store;
};

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const store = initStore(getInitialState());
        const dispatch = store.dispatch as Dispatch;
        await dispatch(connectInitThunk());
        const call = dispatch(deviceSettingsActions.changePin({ remove: false }));
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        // fake few ui events, just like when user is changing PIN
        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_PIN,
            payload: { type: 'PinMatrixRequestType_NewFirst', device },
        });

        await call;

        // not interested in the last action (its from changePin mock);
        store.getActions().pop();
        expect(store.getActions()).toMatchObject([
            { type: connectInitThunk.pending.type, payload: undefined },
            { type: connectInitThunk.fulfilled.type, payload: undefined },
            { type: lockDevice.type, payload: true },
            { type: UI_REQUEST.REQUEST_BUTTON, payload: { code: 'ButtonRequest_ProtectCall' } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'ButtonRequest_ProtectCall' }, device },
            },
            {
                type: UI_REQUEST.REQUEST_PIN,
                payload: { type: 'PinMatrixRequestType_NewFirst', device },
            },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'PinMatrixRequestType_NewFirst' }, device },
            },
            { type: lockDevice.type, payload: false },
            { type: deviceActions.removeButtonRequests.type, payload: { device } },
        ]);
    });
});
