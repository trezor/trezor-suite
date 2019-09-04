import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import notificationReducer, { NotificationEntry } from '@suite-reducers/notificationReducer';
import * as notificationActions from '../notificationActions';

const getInitialState = (): { notifications: NotificationEntry[] } => ({
    notifications: [],
});

const getNotificationPayload = (data?: any) => ({
    title: 'title',
    variant: 'success',
    id: 'foo-id',
    cancelable: true,
    ...data,
});

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

const updateStore = (store: ReturnType<typeof mockStore>) => {
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { notifications } = store.getState();
        store.getState().notifications = notificationReducer(notifications, action);
        store.getActions().push(action);
    });
};

describe('Notifications Actions', () => {
    it('add notifications', () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        store.dispatch(
            notificationActions.add(getNotificationPayload({ title: 'first', variant: 'error' })),
        );
        expect(store.getState().notifications.length).toEqual(1);
        store.dispatch(
            notificationActions.add(
                getNotificationPayload({ title: 'second', variant: 'success', id: 'some-id' }),
            ),
        );
        expect(store.getState().notifications.length).toEqual(2);
    });

    it('close notification by id', () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        store.getState().notifications = [
            getNotificationPayload({ id: 'some-id' }),
            getNotificationPayload({ id: 'other-id' }),
        ];
        store.dispatch(notificationActions.close({ id: 'some-id' }));
        expect(store.getState().notifications.length).toEqual(1);
        expect(store.getState().notifications[0]).toMatchObject({ id: 'other-id' });
    });

    it('close notification by devicePath', () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        store.getState().notifications = [
            getNotificationPayload({ devicePath: '1' }),
            getNotificationPayload({ devicePath: '2' }),
        ];
        store.dispatch(notificationActions.close({ devicePath: '1' }));
        expect(store.getState().notifications.length).toEqual(1);
        expect(store.getState().notifications[0]).toMatchObject({ devicePath: '2' });
    });

    it('close notification by key', () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        store.getState().notifications = [
            getNotificationPayload({ key: '1' }),
            getNotificationPayload({ key: '2' }),
        ];
        store.dispatch(notificationActions.close({ key: '1' }));
        expect(store.getState().notifications.length).toEqual(1);
        expect(store.getState().notifications[0]).toMatchObject({ key: '2' });
    });
});
