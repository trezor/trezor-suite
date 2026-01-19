import { EventType } from '@suite/analytics';
import { selectIsFeatureSuiteSyncAvailable, suiteSyncActions } from '@suite-common/suite-sync';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exhaustive } from '@trezor/type-utils';

import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import * as metadataThunks from 'src/actions/suite/metadataThunks';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';

/**
 * @deprecated This hook is obsolete. Once legacy metadata labeling is removed -> use only the hook
 * `useSuiteSync` from `@suite-common/suite-sync`.
 */
export const useLabelingCombined = () => {
    const legacyAnalytics = useLegacyAnalytics();
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const isFeatureSuiteSyncAvailable = useSelector(selectIsFeatureSuiteSyncAvailable);

    const legacyMetadataState = useSelector(state => state.metadata);

    const legacyDisableIfNeeded = () => {
        if (legacyMetadataState.enabled) dispatch(metadataThunks.disableMetadata());
    };

    const toggleIsFeatureSuiteSyncAvailable = () => {
        dispatch(
            suiteSyncActions.updateIsFeatureSuiteSyncAvailable({
                isShownInSettings: !isFeatureSuiteSyncAvailable,
            }),
        );

        if (isFeatureSuiteSyncAvailable) {
            suiteSync.turnOffSuiteSync();
        }
    };

    const enableSuiteSyncIfNeeded = () => {
        // Enabling Evolu implicitly disables Legacy Labeling
        if (legacyMetadataState.enabled) legacyDisableIfNeeded();

        legacyAnalytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: 'evolu',
            },
        });

        suiteSync.turnOnSuiteSync({
            onError: ({ error }) => {
                const { type } = error;
                switch (type) {
                    case 'SuiteSyncUnavailableOnDeviceError':
                    case 'DeviceCancelled':
                    case 'DeviceError':
                        dispatch(notificationsActions.addToast({ type: 'error', error: type }));

                        return;
                    default:
                        return exhaustive(type);
                }
            },
        });
    };

    const legacyEnableIfNeeded = () => {
        if (!legacyMetadataState.enabled) {
            suiteSync.turnOffSuiteSync(); // Enabling Legacy Labeling implicitly disables Evolu
            dispatch(metadataLabelingActions.init(true));
        }
    };

    return {
        /** New Labeling: SuiteSync (Evolu) */
        toggleIsFeatureSuiteSyncAvailable,
        enableSuiteSyncIfNeeded,

        /** Legacy Labeling */
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
    };
};
