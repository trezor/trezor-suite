import { type TranslationKey } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type NotificationEntry,
    type NotificationsState,
    createNotificationsReducer,
    notificationsActions,
} from '@suite-common/toast-notifications';

import { PROTOCOL } from 'src/actions/suite/constants';
import protocolReducer, { type ProtocolState } from 'src/reducers/suite/protocolReducer';

import protocolMiddleware from './protocolMiddleware';

const middlewares = [protocolMiddleware];

const { reducer: notificationsReducer } = createNotificationsReducer<TranslationKey>();
type State = {
    protocol: ProtocolState;
    notifications: Partial<NotificationsState<TranslationKey>>;
};

const getInitialState = (
    notifications: State['notifications'],
    protocol?: Partial<State['protocol']>,
): State => ({
    protocol: {
        ...protocolReducer(undefined, { type: 'foo' } as any),
        ...protocol,
    },
    notifications: [...notifications],
});

const initStore = (state: State) =>
    createTestCompositionRoot<void, State>({
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
    }).services.store;

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
