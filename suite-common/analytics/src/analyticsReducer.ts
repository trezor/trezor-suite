import { AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { analyticsActions } from './analyticsActions';

export type AnalyticsState = {
    sessionId?: string;
    instanceId?: string;
    enabled?: boolean;
    confirmed?: boolean;
};

type AnalyticsRootState = {
    analytics: AnalyticsState;
};

const analyticsInitialState: AnalyticsState = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
    confirmed: false,
};

export const prepareAnalyticsReducer = createReducerWithExtraDeps(
    analyticsInitialState,
    (builder, extra) => {
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
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => action.payload.analytics || state,
            );
    },
);

// if instanceId does not exist yet (was not loaded from storage), create a new one
export const selectAnalyticsInstanceId = (state: AnalyticsRootState) => state.analytics.instanceId;

export const selectIsAnalyticsConfirmed = (state: AnalyticsRootState) =>
    !!state.analytics.confirmed;

export const selectIsAnalyticsEnabled = (state: AnalyticsRootState): boolean => {
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(state);
    return isAnalyticsConfirmed ? !!state.analytics.enabled : false;
};

export const selectHasUserAllowedTracking = (state: AnalyticsRootState): boolean | undefined => {
    // If the user has not yet confirmed analytics, return undefined.
    // Otherwise, return true or false based on the 'confirmed' and 'enabled' flags.
    if (!state.analytics.confirmed) {
        return undefined;
    }
    return !!state.analytics.confirmed && !!state.analytics.enabled;
};
