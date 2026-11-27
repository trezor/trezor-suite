import {
    selectIsSuiteOnline,
    suiteLifecycleInitialState,
    suiteLifecycleReducer,
    updateOnlineStatus,
} from './suiteLifecycleSlice';

describe('suiteLifecycleReducer', () => {
    it('is online initially', () => {
        const state = suiteLifecycleReducer(undefined, { type: 'unknown' });

        expect(selectIsSuiteOnline({ suiteLifecycle: state })).toBe(true);
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
});
