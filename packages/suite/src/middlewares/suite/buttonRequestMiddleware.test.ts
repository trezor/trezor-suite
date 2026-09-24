import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { debugInitialState } from '@suite/debug';
import { lockDevice } from '@suite/locks';
import { routerReducer } from '@suite/router';
import { suiteSettingsInitialState } from '@suite/settings';
import {
    mockConnectInitSettings,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { deviceActions } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { createTestStore, testMocks } from '@suite-common/test-utils';
import {
    defaultTrezorUIEventHandlerThunk,
    observeSelectedDeviceThunk,
} from '@suite-common/wallet-core';
import { UI_EVENT, UI_EVENTS, UI_REQUEST, UI_REQUESTS } from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import buttonRequestMiddleware from 'src/middlewares/suite/buttonRequestMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { createSuiteConnectInit } from 'src/support/createSuiteConnectInit';

const device = mockSuiteDevice();

const getInitialState = () => ({
    router: routerReducer(undefined, { type: 'foo' } as any),
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
    },
    suiteSettings: suiteSettingsInitialState,
    debug: debugInitialState,
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
    const store = createTestStore({
        extra: undefined,
        middleware: [
            prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
            buttonRequestMiddleware,
        ],
        preloadedState: state,
    });

    return store;
};

const initConnect = (store: ReturnType<typeof initStore>) =>
    createSuiteConnectInit({
        dispatch: store.dispatch,
        getState: store.getState,
        analytics: mockDesktopAnalytics(),
        lockDevice,
        connectInitSettings: mockConnectInitSettings(),
        createLogger: noopCreateLogger,
        createTransports: mockCreateTransports(),
        getAllowPrerelease: mockGetAllowPrerelease(),
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getDebugSettings: mockGetDebugSettings(),
        getThpSettings: mockGetThpSettings(),
        trezorUiEventHandler: action => store.dispatch(defaultTrezorUIEventHandlerThunk(action)),
    })();

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const store = initStore(getInitialState());
        const { dispatch } = store;
        await initConnect(store);
        const call = dispatch(deviceSettingsActions.changePinThunk({ remove: false }));
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        // fake few ui events, just like when user is changing PIN
        emitTestEvent(UI_EVENT, {
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        emitTestEvent(UI_REQUEST, {
            type: UI_REQUESTS.REQUEST_PIN,
            payload: { type: 'PinMatrixRequestType_NewFirst', device },
        });

        await call;

        // Not interested in noisy lifecycle actions from reduxJS toolkit
        const unrelatedActionTypes = [
            observeSelectedDeviceThunk.pending.type,
            observeSelectedDeviceThunk.fulfilled.type,
        ];
        const actions = store
            .getActions()
            .filter(action => !unrelatedActionTypes.includes(action.type));

        // not interested in the last action (its from changePinThunk mock);
        actions.pop();

        expect(actions).toMatchObject([
            { type: lockDevice.type, payload: true },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            { type: UI_EVENTS.BUTTON_REQUEST, payload: { code: 'ButtonRequest_ProtectCall' } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'ButtonRequest_ProtectCall' }, device },
            },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            {
                type: UI_REQUESTS.REQUEST_PIN,
                payload: { type: 'PinMatrixRequestType_NewFirst', device },
            },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'PinMatrixRequestType_NewFirst' }, device },
            },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
            { type: lockDevice.type, payload: false },
            { type: deviceActions.removeButtonRequests.type, payload: { device } },
        ]);
    });
});
