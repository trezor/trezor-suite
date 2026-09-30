import { configureStore } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { DEVICE } from '@trezor/connect';

import { NewContentIndicatorId } from './flagsConstants';
import {
    flagsInitialState,
    markNewContentIndicatorAsSeen,
    prepareFlagsReducer,
    selectFlags,
    selectIsNewContentIndicatorVisible,
    setFlag,
    setNewContentIndicatorSeen,
} from './flagsSlice';

const flagsReducer = prepareFlagsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFlags: mockReducer() },
});

const initStore = (preloadedState = flagsInitialState) =>
    configureStore({
        reducer: { flags: flagsReducer },
        preloadedState: { flags: preloadedState },
    });

const initUnseenStore = () => initStore({ ...flagsInitialState, seenNewContentIndicators: {} });

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

    it('hides all current new-content indicators on a fresh start', () => {
        const store = initStore();

        Object.values(NewContentIndicatorId).forEach(indicatorId => {
            expect(selectIsNewContentIndicatorVisible(indicatorId)(store.getState())).toBe(false);
        });
    });

    it('marks only the selected new-content indicator as seen', () => {
        const store = initUnseenStore();

        store.dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.Activity26_8));

        expect(
            selectIsNewContentIndicatorVisible(NewContentIndicatorId.Activity26_8)(
                store.getState(),
            ),
        ).toBe(false);
        expect(
            selectIsNewContentIndicatorVisible(NewContentIndicatorId.Earn26_8)(store.getState()),
        ).toBe(true);
    });

    it('marks a new-content indicator as seen idempotently', () => {
        const store = initUnseenStore();

        store.dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.Earn26_8));
        store.dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.Earn26_8));

        expect(store.getState().flags.seenNewContentIndicators).toEqual({
            [NewContentIndicatorId.Earn26_8]: true,
        });
    });

    it('allows a new-content indicator to be toggled for debugging', () => {
        const store = initStore();
        const indicatorId = NewContentIndicatorId.Activity26_8;

        store.dispatch(setNewContentIndicatorSeen({ indicatorId, isSeen: true }));
        expect(selectIsNewContentIndicatorVisible(indicatorId)(store.getState())).toBe(false);

        store.dispatch(setNewContentIndicatorSeen({ indicatorId, isSeen: false }));
        expect(selectIsNewContentIndicatorVisible(indicatorId)(store.getState())).toBe(true);
        expect(store.getState().flags.seenNewContentIndicators).toEqual({
            [NewContentIndicatorId.Earn26_8]: true,
        });
    });

    it('shows a newly introduced ID missing from an existing baseline', () => {
        const store = initStore({
            ...flagsInitialState,
            seenNewContentIndicators: { [NewContentIndicatorId.Activity26_8]: true },
        });

        expect(
            selectIsNewContentIndicatorVisible(NewContentIndicatorId.Earn26_8)(store.getState()),
        ).toBe(true);
        expect(
            selectIsNewContentIndicatorVisible(NewContentIndicatorId.Activity26_8)(
                store.getState(),
            ),
        ).toBe(false);
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
