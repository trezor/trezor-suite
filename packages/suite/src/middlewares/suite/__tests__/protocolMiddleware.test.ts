import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { NOTIFICATION, PROTOCOL } from '@suite-actions/constants';
import protocolMiddleware from '../protocolMiddleware';
import protocolReducer from '@suite-reducers/protocolReducer';
import notificationReducer from '@suite-reducers/notificationReducer';

const middlewares = [protocolMiddleware];

type ProtocolState = ReturnType<typeof protocolReducer>;
type NotificationsState = ReturnType<typeof notificationReducer>;

export const getInitialState = (
    notifications: Partial<NotificationsState>,
    protocol?: Partial<ProtocolState>,
) => ({
    protocol: {
        ...protocolReducer(undefined, { type: 'foo' } as any),
        ...protocol,
    },
    notifications: [...notifications],
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([thunk, ...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { protocol, notifications } = store.getState();

        store.getState().protocol = protocolReducer(protocol, action);
        // @ts-ignore
        store.getState().notifications = notificationReducer(notifications, action);

        store.getActions().push(action);
    });
    return store;
};

describe('Protocol middleware', () => {
    it('closes old protocol notifications', async () => {
        const notificationIdToBeClosed = 1632381474504;

        const notifications = [
            {
                context: 'event',
                id: 1632381476344,
                type: 'device-connect',
                seen: true,
            },
            {
                context: 'toast',
                id: notificationIdToBeClosed,
                seen: true,
                type: 'coin-scheme-protocol',
                address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
                amount: 0.001,
                scheme: 'bitcoin',
                autoClose: false,
            },
        ];

        // @ts-ignore
        const store = initStore(getInitialState(notifications));
        await store.dispatch({
            type: PROTOCOL.SAVE_COIN_PROTOCOL,
            payload: {
                address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
                amount: 0.001,
                scheme: 'bitcoin',
                shouldFill: false,
            },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                payload: {
                    address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
                    amount: 0.001,
                    scheme: 'bitcoin',
                    shouldFill: false,
                },
                type: '@protocol/save-coin-protocol',
            },
            { type: NOTIFICATION.CLOSE, payload: notificationIdToBeClosed },
        ]);
    });
});
