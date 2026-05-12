import { createReducerWithExtraDeps, createWeakMapSelector } from '@suite-common/redux-utils';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
export interface BioAuthState {
    /** enabled by user settings */
    bioAuthEnabled: boolean;
    /**
     * available on this system (turned on in system settings)
     */
    bioAuthAvailable: boolean;
    /**
     * whether we require user to validate via bio-auth to access the app
     **/
    bioAuthValidationRequired: boolean;
    /**
     * user cancelled bio-auth prompt meaning we are not going to auto-prompt again
     */
    cancelled: boolean;
}

export type BioAuthRootState = {
    bioAuth: BioAuthState;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<BioAuthRootState>();

const selectBioAuthAvailable = (state: BioAuthRootState) => state.bioAuth.bioAuthAvailable;
const selectBioAuthEnabled = (state: BioAuthRootState) => state.bioAuth.bioAuthEnabled;
const selectBioAuthValidationRequired = (state: BioAuthRootState) =>
    state.bioAuth.bioAuthValidationRequired;
const selectBioAuthCancelled = (state: BioAuthRootState) => state.bioAuth.cancelled;

export const selectBioAuthState = createMemoizedSelector(
    [
        selectBioAuthAvailable,
        selectBioAuthEnabled,
        selectBioAuthValidationRequired,
        selectBioAuthCancelled,
    ],
    (isBioAuthAvailable, isBioAuthEnabled, isBioAuthValidationRequired, cancelled) => ({
        isBioAuthAvailable,
        isBioAuthEnabled,
        isBioAuthValidationRequired,
        cancelled,
    }),
);

const initialState: BioAuthState = {
    bioAuthEnabled: false,
    bioAuthAvailable: false,
    bioAuthValidationRequired: false,
    cancelled: false,
};

export const prepareBioAuthReducer = createReducerWithExtraDeps<BioAuthState>(
    initialState,
    (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadBioAuth);
        builder.addCase(bioAuthActions.setBioAuthEnabled, (state, action) => {
            state.bioAuthEnabled = action.payload;
        });
        builder.addCase(bioAuthActions.setIsBioAuthAvailable, (state, action) => {
            state.bioAuthAvailable = action.payload;
        });
        builder.addCase(bioAuthActions.setIsBioAuthValidationRequired, (state, action) => {
            state.bioAuthValidationRequired = action.payload;
        });
        builder.addCase(bioAuthActions.setCancelled, (state, action) => {
            state.cancelled = action.payload;
        });
    },
);
