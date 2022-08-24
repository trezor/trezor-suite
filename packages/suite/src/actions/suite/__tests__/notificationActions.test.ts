import { configureStore } from '@suite/support/tests/configureStore';

import suiteReducer from '@suite-reducers/suiteReducer';
import notificationReducer from '@suite-reducers/notificationReducer';
import * as notificationActions from '../notificationActions';

type SuiteState = ReturnType<typeof suiteReducer>;
type NotificationState = ReturnType<typeof notificationReducer>;
interface InitialState {
    suite?: Partial<SuiteState>;
    notifications?: NotificationState;
}

export const getInitialState = (state: InitialState | undefined) => {
    const suite = state ? state.suite : undefined;
    const notifications = state ? state.notifications : undefined;
    return {
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
        notifications: notifications || notificationReducer(undefined, { type: 'foo' } as any),
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, notifications } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().notifications = notificationReducer(notifications, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Notifications Actions', () => {
    it('add notifications', () => {
        const store = initStore(getInitialState(undefined));
        store.dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: '0',
                descriptor: 'xpub',
                symbol: 'btc',
                txid: 'abcd',
            }),
        );
        expect(store.getState().notifications.length).toEqual(1);
        store.dispatch(notificationActions.addToast({ type: 'copy-to-clipboard' }));
        expect(store.getState().notifications.length).toEqual(2);
    });

    it('close notification by id', () => {
        const store = initStore(
            getInitialState({
                notifications: [
                    { id: 1, context: 'toast', type: 'copy-to-clipboard' },
                    {
                        id: 2,
                        context: 'toast',
                        type: 'tx-sent',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: 'abcd',
                    },
                ],
            }),
        );
        store.dispatch(notificationActions.close(1));
        store.dispatch(notificationActions.close(10)); // does not exists
        const { notifications } = store.getState();
        expect(notifications.filter(n => !n.closed).length).toEqual(1);
        expect(notifications.filter(n => n.closed).length).toEqual(1);
    });

    it('removeTransactionEvents', () => {
        const store = initStore(
            getInitialState({
                notifications: [
                    {
                        id: 1,
                        context: 'toast',
                        type: 'tx-sent',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '1',
                    },
                    {
                        id: 2,
                        context: 'event',
                        type: 'tx-confirmed',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '2',
                    },
                    {
                        id: 3,
                        context: 'event',
                        type: 'tx-received',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '3',
                    },
                    {
                        id: 4,
                        context: 'toast',
                        type: 'backup-success',
                    },
                ],
            }),
        );
        store.dispatch(notificationActions.removeTransactionEvents([{ txid: '1' }, { txid: '2' }]));
        expect(store.getState().notifications.length).toEqual(2);
        store.dispatch(notificationActions.removeTransactionEvents([{ txid: '3' }]));
        expect(store.getState().notifications.length).toEqual(1);
    });

    it('removeAccountEvents', () => {
        const store = initStore(
            getInitialState({
                notifications: [
                    {
                        id: 1,
                        context: 'toast',
                        type: 'tx-sent',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '1',
                    },
                    {
                        id: 2,
                        context: 'event',
                        type: 'tx-confirmed',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '2',
                    },
                    {
                        id: 3,
                        context: 'event',
                        type: 'tx-received',
                        formattedAmount: '0',
                        descriptor: 'xpub',
                        symbol: 'btc',
                        txid: '3',
                    },
                    {
                        id: 4,
                        context: 'toast',
                        type: 'backup-success',
                    },
                ],
            }),
        );
        store.dispatch(notificationActions.removeAccountEvents('xpub'));
        expect(store.getState().notifications.length).toEqual(1);
    });
});
