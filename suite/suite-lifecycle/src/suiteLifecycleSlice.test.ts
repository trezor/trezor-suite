import { storageCorrupted, storageError } from './storageLifecycleActions';
import {
    onSuiteInit,
    onSuiteReady,
    selectIsSuiteOnline,
    selectSuiteLifecycle,
    setConnectInitError,
    suiteLifecycleInitialState,
    suiteLifecycleReducer,
    updateOnlineStatus,
} from './suiteLifecycleSlice';

describe('suiteLifecycleReducer', () => {
    it('is online and initial initially', () => {
        const state = { suiteLifecycle: suiteLifecycleReducer(undefined, { type: 'unknown' }) };

        expect(selectIsSuiteOnline(state)).toBe(true);
        expect(selectSuiteLifecycle(state)).toEqual({ status: 'initial' });
    });

    it('updates online status', () => {
        const offline = suiteLifecycleReducer(
            suiteLifecycleInitialState,
            updateOnlineStatus(false),
        );
        const online = suiteLifecycleReducer(offline, updateOnlineStatus(true));

        expect(selectIsSuiteOnline({ suiteLifecycle: offline })).toBe(false);
        expect(selectIsSuiteOnline({ suiteLifecycle: online })).toBe(true);
    });

    it.each([
        [onSuiteInit(), { status: 'loading' }],
        [onSuiteReady(), { status: 'ready' }],
        [setConnectInitError('Error'), { status: 'connect-error', error: 'Error' }],
        [storageError('blocked'), { status: 'db-error', error: 'blocked' }],
        [storageCorrupted('Corrupted'), { status: 'db-corrupted', error: 'Corrupted' }],
    ])('sets lifecycle on %o', (action, lifecycle) => {
        const state = suiteLifecycleReducer(suiteLifecycleInitialState, action);

        expect(selectSuiteLifecycle({ suiteLifecycle: state })).toEqual(lifecycle);
    });
});
