import { AnyAction, createSliceWithExtraDeps, createThunk } from '@suite-common/redux-utils';
import {
    SuiteSyncInteraction,
    SuiteSyncState,
    WithSuiteSyncAndDeviceState,
    initialSuiteSyncState as commonInitialState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncInteraction,
    suiteSyncReducer,
} from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';
import { typedObjectFromEntries } from '@trezor/utils';

import { SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';
import { Action } from 'src/types/suite';

import { STORAGE } from '../suite/constants';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: StaticSessionId | null;
};

type EnableSuiteSyncModalWaitResult = boolean;

const enableSuiteSyncModalWaiters = new Map<
    StaticSessionId,
    (result: EnableSuiteSyncModalWaitResult) => void
>();

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

export const openEnableSuiteSyncModalAndWaitThunk = createThunk<
    EnableSuiteSyncModalWaitResult,
    StaticSessionId,
    void
>(
    '@suite/suiteSync/openEnableSuiteSyncModalAndWaitThunk',
    async (deviceStaticSessionId, { dispatch }) => {
        dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

        return await new Promise<EnableSuiteSyncModalWaitResult>(resolve => {
            const existingWaiter = enableSuiteSyncModalWaiters.get(deviceStaticSessionId);
            if (existingWaiter !== undefined) {
                existingWaiter(false);
            }

            enableSuiteSyncModalWaiters.set(deviceStaticSessionId, resolve);
        });
    },
);

export const closeEnableSuiteSyncModalAndResolveThunk = createThunk<void, StaticSessionId, void>(
    '@suite/suiteSync/closeEnableSuiteSyncModalAndResolveThunk',
    (deviceStaticSessionId, { dispatch, getState }) => {
        const state = getState() as DesktopSuiteSyncRootState & WithSuiteSyncAndDeviceState;
        const suiteSyncInteraction = selectSuiteSyncInteraction(state, deviceStaticSessionId);
        const shouldStartEditing =
            selectIsSuiteSyncEnabled(state) &&
            (suiteSyncInteraction === null || suiteSyncInteraction === 'keys-needed');

        const waiter = enableSuiteSyncModalWaiters.get(deviceStaticSessionId);
        if (waiter !== undefined) {
            waiter(shouldStartEditing);
            enableSuiteSyncModalWaiters.delete(deviceStaticSessionId);
        }

        dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
    },
);
