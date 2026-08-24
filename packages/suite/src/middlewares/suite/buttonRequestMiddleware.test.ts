import { debugInitialState } from '@suite/debug';
import { lockDevice } from '@suite/locks';
import { routerReducer } from '@suite/router';
import { suiteSettingsInitialState } from '@suite/settings';
import { connectInitThunk } from '@suite-common/connect-init';
import { deviceActions } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    testMocks,
} from '@suite-common/test-utils';
import { defaultTrezorUIEventHandlerThunk, observeSelectedDevice } from '@suite-common/wallet-core';
import { UI_EVENT, UI_REQUEST } from '@trezor/connect';

import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import buttonRequestMiddleware from 'src/middlewares/suite/buttonRequestMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';

import { extraDependenciesDesktopMock } from '../../../mocks/extraDependenciesDesktopMock';

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
    const store = configureMockStore({
        extra: extraDependenciesDesktopMock,
        middleware: [
            prepareSuiteMiddleware(() => extraDependenciesCommonMock),
            buttonRequestMiddleware,
        ],
        preloadedState: state,
    });

    return store;
};

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const store = initStore(getInitialState());
        const { dispatch } = store;
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

        // Not interested in noisy lifecycle actions from reduxJS toolkit
        const unrelatedActionTypes = [
            observeSelectedDevice.pending.type,
            observeSelectedDevice.fulfilled.type,
        ];
        const actions = store
            .getActions()
            .filter(action => !unrelatedActionTypes.includes(action.type));

        // not interested in the last action (its from changePin mock);
        actions.pop();

        expect(actions).toMatchObject([
            { type: connectInitThunk.pending.type, payload: undefined },
            { type: connectInitThunk.fulfilled.type, payload: undefined },
            { type: lockDevice.type, payload: true },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            { type: UI_REQUEST.REQUEST_BUTTON, payload: { code: 'ButtonRequest_ProtectCall' } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'ButtonRequest_ProtectCall' }, device },
            },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            {
                type: UI_REQUEST.REQUEST_PIN,
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
