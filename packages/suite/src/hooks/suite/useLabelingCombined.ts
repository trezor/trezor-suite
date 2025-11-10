import {
    disposeAllLocalFirstStorageThunk,
    labelingActions,
    selectIsFeatureLocalFirstStorageAvailable,
    selectIsLocalFirstStorageDebugEnabled,
    selectIsLocalFirstStorageEnabled,
} from '@suite-common/local-first-storage';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { initSuiteLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';

import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';

type UseLabelingCombinedParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    deviceStaticSessionId: StaticSessionId | undefined;
};

export const useLabelingCombined = ({ deviceStaticSessionId }: UseLabelingCombinedParams) => {
    const dispatch = useDispatch();

    const device = useSelector(state =>
        deviceStaticSessionId !== undefined
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const isLocalFirstStorageEnabled = useSelector(selectIsLocalFirstStorageEnabled);
    const isLocalFirstStorageDebugEnabled = useSelector(selectIsLocalFirstStorageDebugEnabled);
    const isFeatureLocalFirstStorageAvailable = useSelector(
        selectIsFeatureLocalFirstStorageAvailable,
    );

    const legacyMetadataState = useSelector(state => state.metadata);

    const toggleIsFeatureLocalFirstStorageAvailable = () => {
        dispatch(
            labelingActions.updateIsFeatureLocalFirstStorageAvailable({
                isShownInSettings: !isFeatureLocalFirstStorageAvailable,
            }),
        );
    };

    const legacyDisableIfNeeded = () => {
        if (legacyMetadataState.enabled) dispatch(metadataActions.disableMetadata());
    };

    const localFirstDisableIfNeeded = () => {
        if (isLocalFirstStorageEnabled) {
            dispatch(labelingActions.updateLocalFirstStorageEnabled({ isEnabled: false }));
            dispatch(disposeAllLocalFirstStorageThunk());
        }
    };

    const localFirstEnableIfNeeded = () => {
        // Enabling Evolu implicitly disables Legacy Labeling
        if (legacyMetadataState.enabled) legacyDisableIfNeeded();

        if (!isLocalFirstStorageEnabled) {
            dispatch(labelingActions.updateLocalFirstStorageEnabled({ isEnabled: true }));
            dispatch(initSuiteLocalFirstStorageThunk());

            analytics.report({
                type: EventType.SettingsGeneralLabelingProvider,
                payload: {
                    provider: 'evolu',
                },
            });
        }
    };

    const legacyEnableIfNeeded = () => {
        if (!legacyMetadataState.enabled) {
            localFirstDisableIfNeeded(); // Enabling Legacy Labeling implicitly disables Evolu
            dispatch(metadataLabelingActions.init(true));
        }
    };

    const isEvoluSupportedByDevice = device?.unavailableCapabilities?.evolu === undefined;

    const hasDeviceLocalFirstStorageKeys = device?.localFirstStorageSecret?.evoluKeys !== undefined;

    return {
        /** New Labeling: LocalFirstStorage (Evolu) */
        isFeatureLocalFirstStorageAvailable,
        toggleIsFeatureLocalFirstStorageAvailable,
        isLocalFirstStorageEnabled,
        isEvoluSupportedByDevice,
        isLocalFirstStorageDebugEnabled,
        hasDeviceLocalFirstStorageKeys,
        localFirstEnableIfNeeded,
        localFirstDisableIfNeeded,

        /** Legacy Labeling */
        legacyMetadataState,
        legacyEnableIfNeeded,
        legacyDisableIfNeeded,
    };
};
