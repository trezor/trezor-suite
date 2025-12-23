import {
    selectIsFeatureSuiteSyncAvailable,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import * as metadataThunks from 'src/actions/suite/metadataThunks';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';

type UseLabelingCombinedParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    deviceStaticSessionId: StaticSessionId | undefined;
};

/**
 * @deprecated This hook is obsolete. Once legacy metadata labeling is removed -> use only the hook
 * `useSuiteSync` from `@suite-common/suite-sync`.
 */
export const useLabelingCombined = ({ deviceStaticSessionId }: UseLabelingCombinedParams) => {
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const device = useSelector(state =>
        deviceStaticSessionId !== undefined
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const isFeatureSuiteSyncAvailable = useSelector(selectIsFeatureSuiteSyncAvailable);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

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

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: 'evolu',
            },
        });
        suiteSync.turnOnSuiteSync();
    };

    const legacyEnableIfNeeded = () => {
        if (!legacyMetadataState.enabled) {
            suiteSync.turnOffSuiteSync(); // Enabling Legacy Labeling implicitly disables Evolu
            dispatch(metadataLabelingActions.init(true));
        }
    };

    const isEvoluSupportedByDevice = device?.unavailableCapabilities?.evolu === undefined;

    const hasDeviceSuiteSyncOwner = device?.suiteSyncOwner !== undefined;

    return {
        /** New Labeling: SuiteSync (Evolu) */
        isFeatureSuiteSyncAvailable,
        toggleIsFeatureSuiteSyncAvailable,
        isSuiteSyncEnabled,
        isEvoluSupportedByDevice,
        isSuiteSyncDebugEnabled,
        hasDeviceSuiteSyncOwner,
        enableSuiteSyncIfNeeded,

        /** Legacy Labeling */
        isMetadataEnabled: legacyMetadataState.enabled,
        legacyMetadataState,
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
    };
};
