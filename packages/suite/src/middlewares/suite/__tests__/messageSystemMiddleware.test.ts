import { configureStore } from '@suite/support/tests/configureStore';

import { MESSAGE_SYSTEM } from '@suite-actions/constants';
import suiteReducer from '@suite-reducers/suiteReducer';
import messageSystemReducer from '@suite-reducers/messageSystemReducer';
import WalletReducers from '@wallet-reducers';
import * as messageSystem from '@suite-utils/messageSystem';
import messageSystemMiddleware from '../messageSystemMiddleware';
import { AppState } from '../../../reducers/store';

const middlewares = [messageSystemMiddleware];

type WalletsState = ReturnType<typeof WalletReducers>;
type MessageSystemState = ReturnType<typeof messageSystemReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

export const getInitialState = (
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

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, messageSystem, wallet } = store.getState();

        store.getState().suite = suiteReducer(suite, action);
        store.getState().messageSystem = messageSystemReducer(messageSystem, action);
        store.getState().wallet = WalletReducers(wallet, action);

        store.getActions().push(action);
    });
    return store;
};

describe('Message system middleware', () => {
    it('prepares valid messages for being displayed', async () => {
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
        jest.spyOn(messageSystem, 'getValidMessages').mockImplementation(() => [
            message1,
            message2,
            message3,
            message4,
        ]);

        const store = initStore(getInitialState(undefined, undefined, undefined));
        await store.dispatch({
            type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
                payload: {
                    banner: [message1.id, message2.id],
                    modal: [message2.id, message3.id],
                    context: [message2.id],
                    feature: [message4.id],
                },
            },
        ]);
    });

    it('saves messages even if there are no valid messages', async () => {
        jest.spyOn(messageSystem, 'getValidMessages').mockImplementation(() => []);

        const store = initStore(getInitialState(undefined, undefined, undefined));
        await store.dispatch({
            type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
            payload: { config: { sequence: 1 }, timestamp: 0 },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
                payload: { config: { sequence: 1 }, timestamp: 0 },
            },
            {
                type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
                payload: { banner: [], context: [], modal: [], feature: [] },
            },
        ]);
    });
});
