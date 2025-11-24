import { useSuiteSync } from '@suite-common/suite-sync';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';

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

    const device = useSelector(state =>
        deviceStaticSessionId !== undefined
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const {
        isSuiteSyncEnabled,
        isSuiteSyncDebugEnabled,
        isFeatureSuiteSyncAvailable,
        toggleIsFeatureSuiteSyncAvailable,
        disableSuiteSyncIfNeeded,
        enableSuiteSyncIfNeeded: enableSuiteSyncIfNeededCommon,
    } = useSuiteSync({
        device,
    });

    const legacyMetadataState = useSelector(state => state.metadata);

    const legacyDisableIfNeeded = () => {
        if (legacyMetadataState.enabled) dispatch(metadataActions.disableMetadata());
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
        enableSuiteSyncIfNeededCommon();
    };

    const legacyEnableIfNeeded = () => {
        if (!legacyMetadataState.enabled) {
            disableSuiteSyncIfNeeded(); // Enabling Legacy Labeling implicitly disables Evolu
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
        disableSuiteSyncIfNeeded,

        /** Legacy Labeling */
        legacyMetadataState,
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
    };
};
