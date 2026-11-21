import { waitForActiveAppState } from './waitForActiveAppState';
import { mockAppState } from '../mocks/mockAppState';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('waitForActiveAppState', () => {
    it('resolves without keeping a listener when the app is already active', async () => {
        const { getListenerCount } = mockAppState('active');

        await waitForActiveAppState();

        expect(getListenerCount()).toBe(0);
    });

    it('resolves once the app becomes active and unsubscribes', async () => {
        const { changeAppState, getListenerCount } = mockAppState('background');
        const onActive = jest.fn();

        const activePromise = waitForActiveAppState().then(onActive);
        changeAppState('inactive');
        await flushPromises();

        expect(onActive).not.toHaveBeenCalled();
        expect(getListenerCount()).toBe(1);

        changeAppState('active');
        await activePromise;

        expect(onActive).toHaveBeenCalledTimes(1);
        expect(getListenerCount()).toBe(0);
    });
});
