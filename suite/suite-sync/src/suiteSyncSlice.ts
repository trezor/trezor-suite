import { type PayloadAction } from '@reduxjs/toolkit';

import { type MessageSystemRootState } from '@suite-common/message-system';
import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    type SuiteSyncInteraction,
    type SuiteSyncState,
    type WithSuiteSyncAndDeviceState,
    initialSuiteSyncState as commonInitialState,
    selectHasDeviceSuiteSyncError,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncInteraction,
    suiteSyncReducer,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { typedObjectFromEntries } from '@trezor/utils';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: StaticSessionId | null;
    isUnsupportedDeviceBannerDismissed?: boolean;
};

export const initialSuiteSyncDesktopState: DesktopSuiteSyncState = {
    ...commonInitialState,
    showEnableSuiteSyncModal: null,
    isUnsupportedDeviceBannerDismissed: false,
};

export type DesktopSuiteSyncRootState = {
    suiteSync: DesktopSuiteSyncState;
};

type StorageLoadSuiteSyncAction = PayloadAction<
    {
        suiteSyncSettings?: Partial<SuiteSyncState['settings']> & {
            isUnsupportedDeviceBannerDismissed?: boolean;
        };
        suiteSyncOwners?: Array<{
            key: StaticSessionId;
            value: SuiteSyncState['suiteSyncOwners'][StaticSessionId];
        }>;
    },
    '@storage/load'
>;

const suiteSyncSlice = createSliceWithExtraDeps({
    name: 'suiteSync',
    initialState: initialSuiteSyncDesktopState,
    reducers: {
        updateShowEnableSuiteSyncModal: (
            state: DesktopSuiteSyncState,
            action: PayloadAction<{ deviceStaticSessionId: StaticSessionId | null }>,
        ) => {
            state.showEnableSuiteSyncModal = action.payload.deviceStaticSessionId;
        },
        dismissUnsupportedDeviceBanner: (state: DesktopSuiteSyncState) => {
            state.isUnsupportedDeviceBannerDismissed = true;
        },
    },
    extraReducers: builder => {
        builder
            .addCase('@storage/load', (state, action) => {
                const actionWithPayload = action as StorageLoadSuiteSyncAction;

                if (
                    actionWithPayload.type === '@storage/load' && // hack: to prevent dependency
                    (actionWithPayload.payload.suiteSyncSettings ||
                        actionWithPayload.payload.suiteSyncOwners)
                ) {
                    const { isUnsupportedDeviceBannerDismissed, ...suiteSyncSettings } =
                        actionWithPayload.payload.suiteSyncSettings ?? {};

                    return {
                        ...state,
                        isUnsupportedDeviceBannerDismissed:
                            isUnsupportedDeviceBannerDismissed ??
                            state.isUnsupportedDeviceBannerDismissed ??
                            false,
                        settings: {
                            ...state.settings,
                            ...suiteSyncSettings,
                        },
                        suiteSyncOwners: {
                            ...state.suiteSyncOwners,
                            // We need to transform array of { key, value } from storage to the Record
                            ...typedObjectFromEntries(
                                (actionWithPayload.payload.suiteSyncOwners ?? []).map(
                                    ({ key, value }) => [key, value],
                                ),
                            ),
                        },
                    } satisfies DesktopSuiteSyncState;
                }
            })
            .addDefaultCase((state, action) => {
                suiteSyncReducer(state, action);
            });
    },
});

export const selectShowEnableSuiteSyncModal = (
    state: DesktopSuiteSyncRootState,
): StaticSessionId | null => state.suiteSync.showEnableSuiteSyncModal;

export const selectIsUnsupportedDeviceBannerDismissed = (
    state: DesktopSuiteSyncRootState,
): boolean => state.suiteSync.isUnsupportedDeviceBannerDismissed ?? false;

export const selectIsSuiteSyncBannerVisible = (
    state: DesktopSuiteSyncRootState & WithSuiteSyncAndDeviceState & MessageSystemRootState,
    deviceStaticSessionId: StaticSessionId | null,
): boolean => {
    const hasSuiteSyncError = selectHasDeviceSuiteSyncError(state, deviceStaticSessionId);
    const suiteSyncInteraction = selectSuiteSyncInteraction(state, deviceStaticSessionId);
    const isUnsupportedDeviceBannerDismissed = selectIsUnsupportedDeviceBannerDismissed(state);

    return (
        deviceStaticSessionId !== null &&
        hasSuiteSyncError &&
        suiteSyncInteraction !== null &&
        suiteSyncInteraction !== 'suite-sync-off' &&
        (suiteSyncInteraction !== 'unsupported' || !isUnsupportedDeviceBannerDismissed)
    );
};

export const selectDesktopSuiteSyncInteraction = (
    state: DesktopSuiteSyncRootState & WithSuiteSyncAndDeviceState & MessageSystemRootState,
    deviceStaticSessionId: StaticSessionId | null,
    isMetadataEnabled: boolean,
): SuiteSyncInteraction | null => {
    const isSuiteSyncFeatureEnabled = selectIsSuiteSyncFeatureAvailable(state);

    if (!isSuiteSyncFeatureEnabled) {
        return null;
    }

    const interaction = selectSuiteSyncInteraction(state, deviceStaticSessionId);

    // When legacy labeling is enabled (user explicitly chose it in settings)
    // and suite sync is off, don't expose suite sync interactions — respect the user's choice.
    if (interaction === 'suite-sync-off' && isMetadataEnabled) {
        return null;
    }

    return interaction;
};

export const desktopSuiteSyncActions = suiteSyncSlice.actions;
export const { dismissUnsupportedDeviceBanner, updateShowEnableSuiteSyncModal } =
    desktopSuiteSyncActions;

export const prepareSuiteSyncReducer = suiteSyncSlice.prepareReducer;
