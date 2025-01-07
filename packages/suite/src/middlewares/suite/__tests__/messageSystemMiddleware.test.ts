import { combineReducers, Reducer } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { prepareMessageSystemReducer, messageSystemActions } from '@suite-common/message-system';
import * as messageSystemUtils from '@suite-common/message-system/src/messageSystemUtils';
import { prepareDeviceReducer } from '@suite-common/wallet-core';

import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import WalletReducers from 'src/reducers/wallet';
import { AppState } from 'src/reducers/store';

import messageSystemMiddleware from '../messageSystemMiddleware';

// Type annotation as workaround for type-check error "The inferred type of 'default' cannot be named..."
const messageSystemReducer: Reducer = prepareMessageSystemReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);

type WalletsState = ReturnType<typeof WalletReducers>;
type MessageSystemState = ReturnType<typeof messageSystemReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

const getInitialState = (
    messageSystem?: Partial<MessageSystemState>,
    wallet?: Partial<WalletsState>,
    suite?: Partial<SuiteState>,
): Partial<AppState> => ({
    wallet: {
        ...WalletReducers(undefined, { type: 'foo' } as any),
        ...wallet,
    },
    messageSystem: {
        ...messageSystemReducer(undefined, { type: 'foo' } as any),
        ...messageSystem,
    },
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
});

const reducer = combineReducers({
    wallet: WalletReducers,
    messageSystem: messageSystemReducer,
    suite: suiteReducer,
    device: deviceReducer,
});

type State = ReturnType<typeof getInitialState>;

const initStore = (preloadedState: State) => {
    const store = configureMockStore({
        reducer,
        preloadedState,
        middleware: [messageSystemMiddleware],
    });
    store.subscribe(() => {
        const action = store.getActions().pop();
        if (action) {
            const { suite, messageSystem, wallet } = store.getState();

            store.getState().suite = suiteReducer(suite, action);
            store.getState().messageSystem = messageSystemReducer(messageSystem, action);
            if (wallet) store.getState().wallet = WalletReducers(wallet, action);

            store.getActions().push(action);
        }
    });

    return store;
};

describe('Message system middleware', () => {
    it('prepares valid messages for being displayed', () => {
        const message1 = {
            id: '22e6444d-a586-4593-bc8d-5d013f193eba',
            category: 'banner',
        };
        const message2 = {
            id: '469c65a8-8632-11eb-8dcd-0242ac130003',
            category: ['banner', 'context', 'modal'],
        };
        const message3 = {
            id: '506b1322-8632-11eb-8dcd-0242ac130003',
            category: ['modal'],
        };
        const message4 = {
            id: '506b1322-8632-11eb-8dcd-0242ac130004',
            category: 'feature',
        };

        // @ts-expect-error: all properties except category and id are not required for testing
        jest.spyOn(messageSystemUtils, 'getValidMessages').mockImplementation(() => [
            message1,
            message2,
            message3,
            message4,
        ]);
        jest.spyOn(messageSystemUtils, 'getValidExperiments').mockImplementation(() => []);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: {
                    banner: [message1.id, message2.id],
                    modal: [message2.id, message3.id],
                    context: [message2.id],
                    feature: [message4.id],
                },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [],
            },
        ]);
    });

    it('saves messages even if there are no valid messages', () => {
        jest.spyOn(messageSystemUtils, 'getValidMessages').mockImplementation(() => []);
        jest.spyOn(messageSystemUtils, 'getValidExperiments').mockImplementation(() => []);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: { banner: [], context: [], modal: [], feature: [] },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [],
            },
        ]);
    });

    it('test of experiment action', () => {
        const experiment1 = {
            id: '3bed56a4-ecd8-4e0f-9e5f-014b484c2afa',
            groups: [
                {
                    variant: 'A',
                    percentage: 25,
                },
                {
                    variant: 'B',
                    percentage: 75,
                },
            ],
        };

        jest.spyOn(messageSystemUtils, 'getValidExperiments').mockImplementation(() => [
            experiment1.id,
        ]);

        const store = initStore(getInitialState(undefined, undefined));
        store.dispatch({
            type: messageSystemActions.fetchSuccessUpdate.type,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: messageSystemActions.fetchSuccessUpdate.type,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: messageSystemActions.updateValidMessages.type,
                payload: { banner: [], context: [], modal: [], feature: [] },
            },
            {
                type: messageSystemActions.updateValidExperiments.type,
                payload: [experiment1.id],
            },
        ]);
    });
});
