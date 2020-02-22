import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
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
const mockStore = configureStore<State, any>([thunk]);

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
        store.dispatch(notificationActions.add({ type: 'sign-tx-success', txid: 'abcd' }));
        expect(store.getState().notifications.length).toEqual(1);
        store.dispatch(notificationActions.add({ type: 'copy-to-clipboard' }));
        expect(store.getState().notifications.length).toEqual(2);
    });

    it('close notification by id', () => {
        const store = initStore(
            getInitialState({
                notifications: [
                    { id: 1, type: 'copy-to-clipboard' },
                    { id: 2, type: 'sign-tx-success', txid: 'xyz0' },
                ],
            }),
        );
        store.dispatch(notificationActions.close(1));
        store.dispatch(notificationActions.close(10)); // does not exists
        const { notifications } = store.getState();
        expect(notifications.filter(n => !n.hidden).length).toEqual(1);
        expect(notifications.filter(n => n.hidden).length).toEqual(1);
    });
});
