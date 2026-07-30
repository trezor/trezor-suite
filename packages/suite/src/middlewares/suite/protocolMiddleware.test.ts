import { type TranslationKey } from '@suite/intl';
import { configureMockStore } from '@suite-common/test-utils';
import {
    type NotificationEntry,
    createNotificationsReducer,
    notificationsActions,
} from '@suite-common/toast-notifications';

import { PROTOCOL } from 'src/actions/suite/constants';
import protocolReducer from 'src/reducers/suite/protocolReducer';

import protocolMiddleware from './protocolMiddleware';

const middlewares = [protocolMiddleware];

const { reducer: notificationsReducer } = createNotificationsReducer<TranslationKey>();
type ProtocolState = ReturnType<typeof protocolReducer>;
type NotificationsState = ReturnType<typeof notificationsReducer>;

const getInitialState = (
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
    const store = configureMockStore({
        middleware: [...middlewares],
        reducer: (currentState = state, action) => ({
            ...currentState,
            protocol: protocolReducer(currentState.protocol, action),
            notifications: notificationsReducer(
                currentState.notifications as NotificationEntry<TranslationKey>[],
                action,
            ),
        }),
        preloadedState: state,
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
                amount: '0.001',
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
                amount: '0.001',
                scheme: 'bitcoin',
                shouldFill: false,
            },
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                payload: {
                    address: 'bc1q00h58c5vzcyqavwpjvw8tl8r53t9d57e6smwqe',
                    amount: '0.001',
                    scheme: 'bitcoin',
                    shouldFill: false,
                },
                type: '@protocol/save-coin-protocol',
            },
            notificationsActions.close(notificationIdToBeClosed),
        ]);
    });
});
