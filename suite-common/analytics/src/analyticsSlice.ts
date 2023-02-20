import { AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { memoize } from 'proxy-memoize';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

type AnalyticsSliceState = {
    sessionId?: string;
    instanceId?: string;
    enabled?: boolean;
    confirmed?: boolean;
};

type AnalyticsSliceRootState = {
    analytics: AnalyticsSliceState;
};

const analyticsSliceInitialState: AnalyticsSliceState = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
    confirmed: false,
};

export type InitAnalyticsPayload = {
    enabled: boolean;
    confirmed: boolean;
    instanceId: string;
    sessionId: string;
};

export const prepareAnalyticsSlice = createSliceWithExtraDeps({
    name: '@suite-common/analytics',
    initialState: analyticsSliceInitialState,
    reducers: {
        initAnalytics: (state, { payload }: PayloadAction<InitAnalyticsPayload>) => {
            const { enabled, confirmed, instanceId, sessionId } = payload;
            state.enabled = enabled;
            state.confirmed = confirmed;
            state.instanceId = instanceId;
            state.sessionId = sessionId;
        },
        enableAnalytics: state => {
            state.enabled = true;
            state.confirmed = true;
        },
        disableAnalytics: state => {
            state.enabled = false;
            state.confirmed = true;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(
            extra.actionTypes.storageLoad,
            (state, action: AnyAction) => action.payload.analytics || state,
        );
    },
});

// if instanceId does not exist yet (was not loaded from storage), create a new one
export const selectAnalyticsInstanceId = (state: AnalyticsSliceRootState) =>
    state.analytics.instanceId;

export const selectIsAnalyticsConfirmed = (state: AnalyticsSliceRootState) =>
    !!state.analytics.confirmed;

// if user made choice, keep it, otherwise set it to true by default just to prefill the confirmation toggle
export const selectIsAnalyticsEnabled = memoize((state: AnalyticsSliceRootState): boolean => {
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(state);
    return isAnalyticsConfirmed ? !!state.analytics.enabled : false;
});

// allow tracking only if user already confirmed data collection
export const selectHasUserAllowedTracking = (state: AnalyticsSliceRootState): boolean =>
    !!state.analytics.confirmed && !!state.analytics.enabled;

export const analyticsActions = prepareAnalyticsSlice.actions;
export const prepareAnalyticsReducer = prepareAnalyticsSlice.prepareReducer;
