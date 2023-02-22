import { AnyAction } from '@reduxjs/toolkit';
import { memoize } from 'proxy-memoize';

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

// if user made choice, keep it, otherwise set it to true by default just to prefill the confirmation toggle
export const selectIsAnalyticsEnabled = memoize((state: AnalyticsRootState): boolean => {
    const isAnalyticsConfirmed = selectIsAnalyticsConfirmed(state);
    return isAnalyticsConfirmed ? !!state.analytics.enabled : false;
});

// allow tracking only if user already confirmed data collection
export const selectHasUserAllowedTracking = (state: AnalyticsRootState): boolean =>
    !!state.analytics.confirmed && !!state.analytics.enabled;
