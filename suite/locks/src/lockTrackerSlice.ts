import { createSlice } from '@reduxjs/toolkit';

import {
    LOCK_TYPE,
    type LockActionMeta,
    type LockType,
    lockDevice,
    lockRouter,
    lockUI,
} from './locksSlice';

const UNKNOWN_ORIGIN = 'unknown';

export type TrackedLock = {
    id: string;
    type: LockType;
    origin: string;
    acquiredAt: number;
};

export type LockTrackerState = {
    active: TrackedLock[];
    acquiredCount: number;
};

export type LockTrackerRootState = { lockTracker: LockTrackerState };

export const lockTrackerInitialState: LockTrackerState = {
    active: [],
    acquiredCount: 0,
};

const acquire = (state: LockTrackerState, type: LockType, meta: LockActionMeta) => {
    state.acquiredCount += 1;
    state.active.push({
        id: meta.id ?? `${type}-${state.acquiredCount}`,
        type,
        origin: meta.origin ?? UNKNOWN_ORIGIN,
        acquiredAt: meta.at,
    });
};

const release = (state: LockTrackerState, type: LockType, meta: LockActionMeta) => {
    // Calls serialized by `getSynchronize` also complete in acquisition order, so dropping the
    // oldest hold matches what the counter does for releases that carry no id.
    const index =
        meta.id === undefined
            ? state.active.findIndex(lock => lock.type === type)
            : state.active.findIndex(lock => lock.type === type && lock.id === meta.id);

    if (index === -1) return;

    state.active.splice(index, 1);
};

const track = (state: LockTrackerState, type: LockType, enabled: boolean, meta: LockActionMeta) => {
    if (enabled) {
        acquire(state, type, meta);
    } else {
        release(state, type, meta);
    }
};

/**
 * Debug-only bookkeeping of what currently holds each lock in `locksSlice`. It mirrors the
 * counters without feeding back into them, so nothing here can gate application behaviour.
 */
export const lockTrackerSlice = createSlice({
    name: 'lockTracker',
    initialState: lockTrackerInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(lockDevice, (state, { payload, meta }) => {
                track(state, LOCK_TYPE.DEVICE, payload, meta);
            })
            .addCase(lockRouter, (state, { payload, meta }) => {
                track(state, LOCK_TYPE.ROUTER, payload, meta);
            })
            .addCase(lockUI, (state, { payload, meta }) => {
                track(state, LOCK_TYPE.UI, payload, meta);
            });
    },
});

export const lockTrackerReducer = lockTrackerSlice.reducer;

export const selectActiveLocks = (state: LockTrackerRootState) => state.lockTracker.active;
