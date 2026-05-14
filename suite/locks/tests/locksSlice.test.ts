import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import {
    LOCK_TYPE,
    lockDevice,
    lockRouter,
    lockUI,
    locksInitialState,
    locksReducer,
    selectIsDeviceLocked,
    selectIsDeviceOrUiLocked,
    selectIsRouterLocked,
    selectIsRouterOrUiLocked,
} from '../src/locksSlice';

const getStore = (overrides: Partial<typeof locksInitialState> = {}) =>
    configureMockStore({
        reducer: combineReducers({ locks: locksReducer }),
        preloadedState: { locks: { ...locksInitialState, ...overrides } },
    });

const getState = (overrides: Partial<typeof locksInitialState> = {}) => ({
    locks: { ...locksInitialState, ...overrides },
});

describe('locksReducer', () => {
    it('initializes with all locks at 0', () => {
        const store = getStore();
        expect(store.getState().locks).toEqual(locksInitialState);
    });

    it('increments and decrements ui lock counter', () => {
        const store = getStore();

        store.dispatch(lockUI(true));
        expect(store.getState().locks[LOCK_TYPE.UI]).toBe(1);

        store.dispatch(lockUI(true));
        expect(store.getState().locks[LOCK_TYPE.UI]).toBe(2);

        store.dispatch(lockUI(false));
        expect(store.getState().locks[LOCK_TYPE.UI]).toBe(1);

        store.dispatch(lockUI(false));
        expect(store.getState().locks[LOCK_TYPE.UI]).toBe(0);
    });

    it('does not decrement lock counter below 0', () => {
        const store = getStore();
        store.dispatch(lockDevice(false));
        expect(store.getState().locks[LOCK_TYPE.DEVICE]).toBe(0);
    });

    it('handles device lock independently', () => {
        const store = getStore();

        store.dispatch(lockDevice(true));
        expect(store.getState().locks[LOCK_TYPE.DEVICE]).toBe(1);
        expect(store.getState().locks[LOCK_TYPE.UI]).toBe(0);

        store.dispatch(lockDevice(false));
        expect(store.getState().locks[LOCK_TYPE.DEVICE]).toBe(0);
    });

    it('handles router lock independently', () => {
        const store = getStore();

        store.dispatch(lockRouter(true));
        expect(store.getState().locks[LOCK_TYPE.ROUTER]).toBe(1);

        store.dispatch(lockRouter(false));
        expect(store.getState().locks[LOCK_TYPE.ROUTER]).toBe(0);
    });
});

describe('lock selectors', () => {
    it('selectIsDeviceLocked', () => {
        expect(selectIsDeviceLocked(getState())).toBe(false);
        expect(selectIsDeviceLocked(getState({ [LOCK_TYPE.DEVICE]: 1 }))).toBe(true);
    });

    it('selectIsDeviceOrUiLocked', () => {
        expect(selectIsDeviceOrUiLocked(getState())).toBe(false);
        expect(selectIsDeviceOrUiLocked(getState({ [LOCK_TYPE.DEVICE]: 1 }))).toBe(true);
        expect(selectIsDeviceOrUiLocked(getState({ [LOCK_TYPE.UI]: 1 }))).toBe(true);
    });

    it('selectIsRouterLocked', () => {
        expect(selectIsRouterLocked(getState())).toBe(false);
        expect(selectIsRouterLocked(getState({ [LOCK_TYPE.ROUTER]: 1 }))).toBe(true);
    });

    it('selectIsRouterOrUiLocked', () => {
        expect(selectIsRouterOrUiLocked(getState())).toBe(false);
        expect(selectIsRouterOrUiLocked(getState({ [LOCK_TYPE.ROUTER]: 1 }))).toBe(true);
        expect(selectIsRouterOrUiLocked(getState({ [LOCK_TYPE.UI]: 1 }))).toBe(true);
    });
});
