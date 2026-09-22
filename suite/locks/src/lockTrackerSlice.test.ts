import { combineReducers } from '@reduxjs/toolkit';

import { createTestStore } from '@suite-common/test-utils';

import { lockTrackerInitialState, lockTrackerReducer, selectActiveLocks } from './lockTrackerSlice';
import { LOCK_TYPE, lockDevice, lockRouter, locksInitialState, locksReducer } from './locksSlice';

const getStore = () =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({ locks: locksReducer, lockTracker: lockTrackerReducer }),
        preloadedState: { locks: locksInitialState, lockTracker: lockTrackerInitialState },
    });

let currentTime = 1_000;

beforeEach(() => {
    currentTime = 1_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('lockTrackerReducer', () => {
    it('records which call acquired the lock, and when', () => {
        const store = getStore();

        store.dispatch(lockDevice(true, { id: 'call-1', origin: 'discoverAccounts' }));

        expect(selectActiveLocks(store.getState())).toEqual([
            {
                id: 'call-1',
                type: LOCK_TYPE.DEVICE,
                origin: 'discoverAccounts',
                acquiredAt: 1_000,
            },
        ]);
    });

    it('falls back to a generated id and unknown origin', () => {
        const store = getStore();

        store.dispatch(lockDevice(true));

        expect(selectActiveLocks(store.getState())).toEqual([
            expect.objectContaining({ id: 'device-1', origin: 'unknown' }),
        ]);
    });

    it('keeps concurrent holds in acquisition order', () => {
        const store = getStore();

        store.dispatch(lockDevice(true, { id: 'call-1' }));
        store.dispatch(lockRouter(true, { id: 'route-1' }));
        store.dispatch(lockDevice(true, { id: 'call-2' }));

        expect(selectActiveLocks(store.getState()).map(lock => lock.id)).toEqual([
            'call-1',
            'route-1',
            'call-2',
        ]);
    });

    it('releases the matching hold even when it is not the oldest', () => {
        const store = getStore();

        store.dispatch(lockDevice(true, { id: 'call-1' }));
        store.dispatch(lockDevice(true, { id: 'call-2' }));
        store.dispatch(lockDevice(false, { id: 'call-2' }));

        expect(selectActiveLocks(store.getState()).map(lock => lock.id)).toEqual(['call-1']);
    });

    it('releases the oldest hold of that type when no id is given', () => {
        const store = getStore();

        store.dispatch(lockDevice(true, { id: 'call-1' }));
        store.dispatch(lockDevice(true, { id: 'call-2' }));
        store.dispatch(lockDevice(false));

        expect(selectActiveLocks(store.getState()).map(lock => lock.id)).toEqual(['call-2']);
    });

    it('does not release a hold of a different type', () => {
        const store = getStore();

        store.dispatch(lockDevice(true, { id: 'call-1' }));
        store.dispatch(lockRouter(false));

        expect(selectActiveLocks(store.getState()).map(lock => lock.id)).toEqual(['call-1']);
    });

    it('ignores a release that matches no hold', () => {
        const store = getStore();

        store.dispatch(lockDevice(false, { id: 'never-acquired' }));

        expect(selectActiveLocks(store.getState())).toEqual([]);
    });
});
