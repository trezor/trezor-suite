import { differenceInMinutes } from 'date-fns';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';

export interface BioAuthState {
    bioAuthEnabled: boolean;
    bioAuthEnabledNextValue: boolean | null;
    lastBioAuthValidatedTimestamp: number | null;
    lastWindowBlurTimestamp: number | null;
    bioAuthValidationInProgress: boolean;
    bioAuthValidationRequested: boolean;
    windowBlurred: boolean;
    bioAuthAvailable: boolean | null;
}

export const bioAuthPersistedWhitelist = ['bioAuthEnabled'];

export type BioAuthRootState = {
    bioAuth: BioAuthState;
};

const initialState: BioAuthState = {
    bioAuthEnabled: false,
    bioAuthEnabledNextValue: null,
    lastBioAuthValidatedTimestamp: null,
    lastWindowBlurTimestamp: null,
    bioAuthValidationInProgress: false,
    bioAuthValidationRequested: false,
    windowBlurred: false,
    bioAuthAvailable: null,
};

const isBlurredTooLong = ({
    lastWindowBlurTimestamp,
    timestamp,
}: {
    lastWindowBlurTimestamp: number | null;
    timestamp: Date;
}) => {
    const fiveMinutesInMinutes = 5;
    const isBlurredTooLong =
        lastWindowBlurTimestamp &&
        differenceInMinutes(timestamp, new Date(lastWindowBlurTimestamp)) > fiveMinutesInMinutes;

    return isBlurredTooLong;
};

export const prepareBioAuthReducer = createReducerWithExtraDeps<BioAuthState>(
    initialState,
    (builder, extra) => {
        builder
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadBioAuth)
            .addCase(bioAuthActions.setBioAuthEnabled, (state, action) => {
                state.bioAuthEnabled = action.payload;
                state.bioAuthEnabledNextValue = null;
            })
            .addCase(bioAuthActions.requestBioAuthChange, (state, action) => {
                state.bioAuthEnabledNextValue = action.payload;
                state.bioAuthValidationRequested = true;
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
                // NOTE: it happens that when the bio auth validated action is received, the window is not focused but it is in front
                // so that's why we remove the UI that hides it, coz the bio was just validated
                state.windowBlurred = false;
            })
            .addCase(bioAuthActions.bioAuthWindowBlur, (state, action) => {
                state.lastWindowBlurTimestamp = new Date(action.payload).getTime();
                state.windowBlurred = true;
            })
            .addCase(bioAuthActions.bioAuthWindowFocus, (state, action) => {
                state.windowBlurred = false;
                // NOTE: if the window was NOT blurred for too long, we reset the lastWindowBlurTimestamp
                // coz then we would make the app accessible without bio auth
                state.lastWindowBlurTimestamp = !isBlurredTooLong({
                    lastWindowBlurTimestamp: state.lastWindowBlurTimestamp,
                    timestamp: new Date(action.payload),
                })
                    ? null
                    : state.lastWindowBlurTimestamp;
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
