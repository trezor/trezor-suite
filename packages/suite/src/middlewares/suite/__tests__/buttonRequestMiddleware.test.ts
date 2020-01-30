/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { UI_EVENT, UI } from 'trezor-connect';

import { SUITE } from '@suite-actions/constants';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';

import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';

import suiteMiddleware from '@suite-middlewares/suiteMiddleware';
import buttonRequestMiddleware from '@suite-middlewares/buttonRequestMiddleware';

import { Action } from '@suite-types';

const { getSuiteDevice } = global.JestMocks;

jest.mock('@wallet-actions/blockchainActions', () => {
    return {
        __esModule: true, // this property makes it work
        loadFeeInfo: () => ({ type: 'mocked' }),
        init: () => ({ type: 'mocked' }),
    };
});

jest.mock('trezor-connect', () => {
    const callbacks: { [key: string]: Function } = {};
    return {
        __esModule: true, // this property makes it work
        default: {
            init: () => {},
            on: (event: string, cb: Function) => {
                callbacks[event] = cb;
            },
            changePin: () => {
                // emit({ type: 'ui-request_pin'})
                return {
                    success: true,
                    payload: {
                        message: 'great success',
                    },
                };
            },
        },
        DEVICE: {},
        BLOCKCHAIN: {},
        TRANSPORT: {},
        UI: {
            REQUEST_PIN: 'ui-request_pin',
            REQUEST_BUTTON: 'ui-request_button',
        },
        emit: (event: string, data: any) => {
            callbacks[event].call(undefined, {
                event,
                ...data,
            });
        },
    };
});

const device = getSuiteDevice();

export const getInitialState = () => {
    return {
        router: routerReducer(undefined, { type: 'foo' } as any),
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...{ device },
        },
        devices: [device],
    };
};

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>([
        thunk,
        suiteMiddleware,
        buttonRequestMiddleware,
    ]);
    const store = mockStore(state);
    return store;
};

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        require('trezor-connect');
        require('@wallet-actions/blockchainActions');
        const store = initStore(getInitialState());
        // @ts-ignore
        await store.dispatch(trezorConnectActions.init());
        // @ts-ignore
        const call = store.dispatch(deviceSettingsActions.changePin({ remove: false }));
        // fake few ui events, just like when user is changing PIN
        const { emit } = require('trezor-connect');
        emit(UI_EVENT, { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_ProtectCall' } });
        emit(UI_EVENT, { type: UI.REQUEST_PIN });

        await call;

        // not interrested in the last action (its from changePin mock);
        store.getActions().pop();
        expect(store.getActions()).toMatchObject([
            { type: SUITE.CONNECT_INITIALIZED },
            { type: 'mocked' }, // we dont care about this one, it is from middleware flow
            { type: SUITE.LOCK_DEVICE, payload: true },
            { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_ProtectCall' } },
            { type: SUITE.ADD_BUTTON_REQUEST, payload: 'ButtonRequest_ProtectCall', device },
            { type: UI.REQUEST_PIN },
            { type: SUITE.ADD_BUTTON_REQUEST, payload: UI.REQUEST_PIN, device },
            { type: SUITE.LOCK_DEVICE, payload: false },
            { type: SUITE.ADD_BUTTON_REQUEST, device },
        ]);
    });
});
