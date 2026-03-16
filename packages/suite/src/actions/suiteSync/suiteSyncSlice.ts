import { type AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    type SuiteSyncInteraction,
    type SuiteSyncState,
    type WithSuiteSyncAndDeviceState,
    initialSuiteSyncState as commonInitialState,
    selectSuiteSyncInteraction,
    suiteSyncReducer,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { typedObjectFromEntries } from '@trezor/utils';

import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';
import { type Action } from 'src/types/suite';

import { STORAGE } from '../suite/constants';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: StaticSessionId | null;
};

export const initialSuiteSyncDesktopState: DesktopSuiteSyncState = {
    ...commonInitialState,
    showEnableSuiteSyncModal: null,
};

export type DesktopSuiteSyncRootState = {
    suiteSync: DesktopSuiteSyncState;
};

export const suiteSyncSlice = createSliceWithExtraDeps({
    name: 'suiteSync',
    initialState: initialSuiteSyncDesktopState,
    reducers: {
        updateShowEnableSuiteSyncModal: (state, action) => {
            state.showEnableSuiteSyncModal = action.payload.deviceStaticSessionId;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(STORAGE.LOAD, (state, action) => {
                const actionWithPayload = action as Action;

                if (
                    actionWithPayload.type === STORAGE.LOAD &&
                    (actionWithPayload.payload.suiteSyncSettings ||
                        actionWithPayload.payload.suiteSyncOwners)
                ) {
                    return {
                        ...state,
                        settings: {
                            ...state.settings,
                            ...actionWithPayload.payload.suiteSyncSettings,
                        },
                        suiteSyncOwners: {
                            ...state.suiteSyncOwners,

                            // We need to transform array of { key, value } from storage to the Record
                            ...typedObjectFromEntries(
                                actionWithPayload.payload.suiteSyncOwners.map(({ key, value }) => [
                                    key,
                                    value,
                                ]),
                            ),
                        },
                    } satisfies SuiteSyncState;
                }
            })
            .addDefaultCase((state, action) => {
                suiteSyncReducer(state, action as AnyAction);
            });
    },
});

export const selectShowEnableSuiteSyncModal = (
    state: DesktopSuiteSyncRootState,
): StaticSessionId | null => state.suiteSync.showEnableSuiteSyncModal;

export const selectDesktopSuiteSyncInteraction = (
    state: DesktopSuiteSyncRootState & WithSuiteSyncAndDeviceState & SuiteRootState,
    deviceStaticSessionId: StaticSessionId | null,
): SuiteSyncInteraction | null => {
    const isSuiteSyncFeatureEnabled = selectHasExperimentalFeature('suite-sync')(state);
    if (!isSuiteSyncFeatureEnabled) return null;

    return selectSuiteSyncInteraction(state, deviceStaticSessionId);
};

export const { updateShowEnableSuiteSyncModal } = suiteSyncSlice.actions;
