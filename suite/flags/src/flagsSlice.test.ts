import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';

import { flagsInitialState, prepareFlagsReducer, selectFlags, setFlag } from './flagsSlice';

const flagsReducer = prepareFlagsReducer(extraDependenciesCommonMock);

const initStore = (preloadedState = flagsInitialState) =>
    configureStore({
        reducer: { flags: flagsReducer },
        preloadedState: { flags: preloadedState },
    });

describe('flagsSlice', () => {
    it('should return initial state', () => {
        const store = initStore();
        expect(selectFlags(store.getState())).toEqual(flagsInitialState);
    });

    it('should set a flag to true', () => {
        const store = initStore();
        store.dispatch(setFlag({ key: 'initialRun', value: false }));
        expect(store.getState().flags.initialRun).toBe(false);
    });

    it('should set a flag to false', () => {
        const store = initStore();
        store.dispatch(setFlag({ key: 'dashboardAssetsGridMode', value: false }));
        expect(store.getState().flags.dashboardAssetsGridMode).toBe(false);
    });

    it('should not affect other flags when setting one', () => {
        const store = initStore();
        store.dispatch(setFlag({ key: 'taprootBannerClosed', value: true }));

        const state = store.getState().flags;
        expect(state.taprootBannerClosed).toBe(true);
        expect(state.initialRun).toBe(flagsInitialState.initialRun);
        expect(state.dashboardAssetsGridMode).toBe(flagsInitialState.dashboardAssetsGridMode);
    });

    it('should disable no-device eShop banners once a device connects', () => {
        const store = initStore();
        store.dispatch({ type: DEVICE.CONNECT });

        expect(store.getState().flags.areNoDeviceEshopBannersDisabled).toBe(true);
    });

    it('should disable no-device eShop banners once an unacquired device connects', () => {
        const store = initStore();
        store.dispatch({ type: DEVICE.CONNECT_UNACQUIRED });

        expect(store.getState().flags.areNoDeviceEshopBannersDisabled).toBe(true);
    });
});
