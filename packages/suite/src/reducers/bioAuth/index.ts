import { differenceInMilliseconds, differenceInMinutes } from 'date-fns';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';

export interface BioAuthState {
    initialNow: number;
    bioAuthEnabled: boolean;
    blurTimeoutId: NodeJS.Timeout | null;
    bioAuthEnabledNextValue: boolean | null;
    lastBioAuthValidatedTimestamp: number | null;
    lastWindowBlurTimestamp: number | null;
    bioAuthValidationInProgress: boolean;
    bioAuthValidationRequested: boolean;
    bioAuthValidationRequired: boolean;
    windowBlurred: boolean;
    bioAuthAvailable: boolean | null;
}

export const bioAuthPersistedWhitelist = ['bioAuthEnabled'];

export type BioAuthRootState = {
    bioAuth: BioAuthState;
};

const initialState: BioAuthState = {
    initialNow: 0,
    blurTimeoutId: null,
    bioAuthEnabled: false,
    bioAuthEnabledNextValue: null,
    lastBioAuthValidatedTimestamp: null,
    lastWindowBlurTimestamp: null,
    bioAuthValidationInProgress: false,
    bioAuthValidationRequested: false,
    bioAuthValidationRequired: false,
    windowBlurred: false,
    bioAuthAvailable: null,
};

export const BLUR_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

const isBlurredTooLong = ({
    lastWindowBlurTimestamp,
    timestamp,
    bioAuthValidationRequired,
}: {
    lastWindowBlurTimestamp: number | null;
    timestamp: Date;
    bioAuthValidationRequired: boolean;
}) => {
    const isBlurredTooLong =
        lastWindowBlurTimestamp &&
        differenceInMilliseconds(timestamp, new Date(lastWindowBlurTimestamp)) >
            BLUR_LOCK_TIMEOUT_MS;

    return isBlurredTooLong || bioAuthValidationRequired;
};

export const prepareBioAuthReducer = createReducerWithExtraDeps<BioAuthState>(
    initialState,
    (builder, extra) => {
        builder
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadBioAuth)
            .addCase(bioAuthActions.initBioAuth, (state, action) => {
                state.initialNow = action.payload;
            })
            .addCase(bioAuthActions.setBioAuthEnabled, (state, action) => {
                state.bioAuthEnabled = action.payload;
                state.bioAuthEnabledNextValue = null;
            })
            .addCase(bioAuthActions.requestBioAuthChange, (state, action) => {
                state.bioAuthEnabledNextValue = action.payload;
                state.bioAuthValidationRequested = true;
            })
            .addCase(bioAuthActions.setBioAuthValidationRequired, state => {
                state.bioAuthValidationRequired = true;
            })
            .addCase(bioAuthActions.requestBioAuthChangeEnd, state => {
                state.bioAuthEnabledNextValue = null;
            })
            .addCase(bioAuthActions.bioAuthValidated, (state, action) => {
                state.lastBioAuthValidatedTimestamp = action.payload
                    ? new Date(action.payload).getTime()
                    : null;
                state.bioAuthValidationRequested = false;
                state.lastWindowBlurTimestamp = null;
                state.bioAuthValidationRequired = false;
                // NOTE: it happens that when the bio auth validated action is received, the window is not focused but it is in front
                // so that's why we remove the UI that hides it, coz the bio was just validated
                state.windowBlurred = false;
            })
            .addCase(bioAuthActions.bioAuthWindowBlur, (state, action) => {
                state.lastWindowBlurTimestamp = new Date(action.payload.blurDate).getTime();
                state.windowBlurred = true;
                state.blurTimeoutId = action.payload.timeoutId;
            })
            .addCase(bioAuthActions.bioAuthWindowFocus, state => {
                state.windowBlurred = false;
                state.lastWindowBlurTimestamp = null;

                state.blurTimeoutId = null;
            })
            .addCase(bioAuthActions.toggleBioAuthValidationRequested, (state, action) => {
                state.bioAuthValidationRequested = action.payload;
            })
            .addCase(bioAuthActions.setBioAuthAvailable, (state, action) => {
                state.bioAuthAvailable = action.payload;
            });
    },
);

export const selectBioAuthState = (state: BioAuthRootState) => state.bioAuth;

export const selectBioAuthEnabled = (state: BioAuthRootState) =>
    selectBioAuthState(state).bioAuthEnabled;

export const selectBioAuthChangeNextValue = (state: BioAuthRootState) =>
    selectBioAuthState(state).bioAuthEnabledNextValue;

export const selectIsRequestingBioAuthChange = (state: BioAuthRootState) =>
    selectBioAuthState(state).bioAuthEnabledNextValue !== null;

export const selectLastBioAuthValidatedTimestamp = (state: BioAuthRootState) =>
    selectBioAuthState(state).lastBioAuthValidatedTimestamp;

export const selectIsBioAuthValidationRequired = (
    state: BioAuthRootState,
    timestamp: Date = new Date(),
) => {
    if (!selectBioAuthEnabled(state)) {
        return false;
    }

    const lastBioAuthValidatedTimestamp = selectLastBioAuthValidatedTimestamp(state);
    if (!lastBioAuthValidatedTimestamp) {
        return true;
    }

    const dayInMinutes = 24 * 60;
    const isValidationExpired =
        differenceInMinutes(timestamp, new Date(lastBioAuthValidatedTimestamp)) > dayInMinutes;

    const blurredTooLong = isBlurredTooLong({
        lastWindowBlurTimestamp: state.bioAuth.lastWindowBlurTimestamp,
        timestamp,
        bioAuthValidationRequired: state.bioAuth.bioAuthValidationRequired,
    });

    return Boolean(isValidationExpired || blurredTooLong);
};

export const selectIsBioAuthValidationRequested = (state: BioAuthRootState) =>
    selectBioAuthState(state).bioAuthValidationRequested;

export const selectIsAppUiHidden = (state: BioAuthRootState) => {
    const bioAuthState = selectBioAuthState(state);

    return (
        (bioAuthState.windowBlurred && selectBioAuthEnabled(state)) ||
        (selectIsBioAuthValidationRequested(state) && selectBioAuthEnabled(state))
    );
};

export const selectIsWindowFocused = (state: BioAuthRootState) =>
    !selectBioAuthState(state).windowBlurred;

export const selectIsBioAuthAvailableStateKnown = (state: BioAuthRootState) =>
    selectBioAuthState(state).bioAuthAvailable !== null;

export const selectIsBioAuthAvailable = (state: BioAuthRootState) =>
    Boolean(selectBioAuthState(state).bioAuthAvailable);

export const selectBlurTimeoutId = (state: BioAuthRootState) =>
    selectBioAuthState(state).blurTimeoutId;
