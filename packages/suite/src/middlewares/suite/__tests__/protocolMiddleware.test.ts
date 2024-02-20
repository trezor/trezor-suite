import { configureStore } from 'src/support/tests/configureStore';

import { PROTOCOL } from 'src/actions/suite/constants';
import protocolMiddleware from '../protocolMiddleware';
import protocolReducer from 'src/reducers/suite/protocolReducer';
import {
    NotificationEntry,
    notificationsActions,
    notificationsReducer,
} from '@suite-common/toast-notifications';

const middlewares = [protocolMiddleware];

type ProtocolState = ReturnType<typeof protocolReducer>;
type NotificationsState = ReturnType<typeof notificationsReducer>;

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
    const mockStore = configureStore<State, any>([...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { protocol, notifications } = store.getState();

        store.getState().protocol = protocolReducer(protocol, action);
        store.getState().notifications = notificationsReducer(
            notifications as NotificationEntry[],
            action,
        );

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

        // @ts-expect-error
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
            notificationsActions.close(notificationIdToBeClosed),
        ]);
    });
});
