import {
    selectServiceWorkerWaitingUpdate,
    serviceWorkerUpdateActions,
    serviceWorkerUpdateInitialState,
    serviceWorkerUpdateReducer,
} from './serviceWorkerUpdateSlice';

describe('serviceWorkerUpdateSlice', () => {
    it('keeps the waiting update until none waits', () => {
        const waitingUpdate = { buildInfo: null };

        const withUpdate = serviceWorkerUpdateReducer(
            serviceWorkerUpdateInitialState,
            serviceWorkerUpdateActions.setWaitingUpdate(waitingUpdate),
        );
        const withoutUpdate = serviceWorkerUpdateReducer(
            withUpdate,
            serviceWorkerUpdateActions.setWaitingUpdate(null),
        );

        expect(selectServiceWorkerWaitingUpdate({ serviceWorkerUpdate: withUpdate })).toEqual(
            waitingUpdate,
        );
        expect(selectServiceWorkerWaitingUpdate({ serviceWorkerUpdate: withoutUpdate })).toBeNull();
    });
});
