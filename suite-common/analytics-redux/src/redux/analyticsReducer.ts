import { type PayloadAction, type UnknownAction } from '@reduxjs/toolkit';

import { type ActionTypesDep, createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { analyticsActions } from './analyticsActions';

export type AnalyticsState = {
    sessionId?: string | undefined;
    instanceId?: string | undefined;
    enabled?: boolean | undefined;
    confirmed?: boolean | undefined;
    customAnalyticsUrl?: string | undefined;
    loggerEnabled?: boolean | undefined;
};

export type AnalyticsRootState = {
    analytics: AnalyticsState;
};
export const analyticsInitialState: AnalyticsState = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
    confirmed: false,
    customAnalyticsUrl: undefined,
    loggerEnabled: undefined,
};

type AnalyticsReducerDeps = ActionTypesDep<'storageLoad'>;
type StorageLoadAnalyticsAction = PayloadAction<{ analytics?: AnalyticsState }>;

export const prepareAnalyticsReducer = createReducerWithExtraDeps(
    analyticsInitialState,
    (builder, extra: AnalyticsReducerDeps) => {
        builder
            .addCase(analyticsActions.initAnalytics, (state, { payload }) => {
                const { enabled, confirmed, instanceId, sessionId } = payload;
                state.enabled = enabled;
                state.confirmed = confirmed;
                state.instanceId = instanceId;
                state.sessionId = sessionId;
            })
            .addCase(analyticsActions.enableAnalytics, state => {
                state.enabled = true;
                state.confirmed = true;
            })
            .addCase(analyticsActions.disableAnalytics, state => {
                state.enabled = false;
                state.confirmed = true;
            })
            .addCase(analyticsActions.setCustomAnalyticsUrl, (state, { payload }) => {
                state.customAnalyticsUrl = payload;
            })
            .addCase(analyticsActions.setLoggerEnabled, (state, { payload }) => {
                state.loggerEnabled = payload;
            })
            .addMatcher(
                (action: UnknownAction): action is StorageLoadAnalyticsAction =>
                    action.type === extra.actionTypes.storageLoad,
                (state, action) => action.payload.analytics || state,
            );
    },
);

// if instanceId does not exist yet (was not loaded from storage), create a new one
export const selectAnalytics = (state: AnalyticsRootState) => state.analytics;

export const selectAnalyticsInstanceId = (state: AnalyticsRootState) => state.analytics.instanceId;

export const selectAnalyticsSessionId = (state: AnalyticsRootState) => state.analytics.sessionId;

export const selectIsAnalyticsConfirmed = (state: AnalyticsRootState) =>
    !!state.analytics.confirmed;

// Use this directly only if you need to handle unconfirmed state differently from the disabled state.
export const selectHasUserAllowedTracking = (state: AnalyticsRootState): boolean | undefined => {
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(state);

    // If the user has not yet confirmed analytics, return undefined.
    return isAnalyticsConfirmed ? !!state.analytics.enabled : undefined;
};

export const selectIsAnalyticsEnabled = (state: AnalyticsRootState): boolean =>
    !!selectHasUserAllowedTracking(state);

export const selectCustomAnalyticsUrl = (state: AnalyticsRootState): string | undefined =>
    state.analytics.customAnalyticsUrl;

export const selectLoggerEnabled = (state: AnalyticsRootState): boolean | undefined =>
    state.analytics.loggerEnabled;
