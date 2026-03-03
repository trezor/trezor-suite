import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
    selectIsDeviceIdCheckSuccess,
    selectIsDeviceInvariabilityCheckSuccess,
    selectIsEntropyCheckFailed,
    selectIsFirmwareAuthenticityCheckDismissed,
} from '@suite-common/device';
import {
    isHardHashCheckError,
    isHardRevisionCheckError,
    isSkippedHashCheckError,
    isSkippedRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';

import { AppState } from 'src/types/suite';

import {
    selectAreDeviceMetaChecksEnabled,
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from './suiteSelectors';

export const selectFirmwareRevisionCheckErrorIfEnabled = (state: AppState) => {
    const revisionCheckError = selectFirmwareRevisionCheckError(state);
    if (revisionCheckError === null) return null;
    if (isSkippedRevisionCheckError(revisionCheckError)) return null;

    const isFirmwareRevisionCheckDisabled = !selectIsFirmwareRevisionCheckEnabled(state);
    if (isFirmwareRevisionCheckDisabled) return null;

    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.firmwareRevisionCheck);
    if (isDisabledByMessageSystem) return null;

    return revisionCheckError;
};

export const selectFirmwareHashCheckErrorIfEnabled = (state: AppState) => {
    const hashCheckError = selectFirmwareHashCheckError(state);
    if (hashCheckError === null) return null;
    if (isSkippedHashCheckError(hashCheckError)) return null;

    const isFirmwareHashCheckDisabled = !selectIsFirmwareHashCheckEnabled(state);
    if (isFirmwareHashCheckDisabled) return null;

    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.firmwareHashCheck);
    if (isDisabledByMessageSystem) return null;

    if (
        hashCheckError === 'other-error' &&
        selectIsFeatureDisabled(state, Feature.firmwareHashCheckOtherError)
    ) {
        return null;
    }

    if (
        hashCheckError === 'takes-too-long' &&
        selectIsFeatureDisabled(state, Feature.firmwareHashCheckTimeout)
    ) {
        return null;
    }

    return hashCheckError;
};

export function selectIsDeviceCompromised(state: AppState): boolean {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);

    return revisionError !== null || hashError !== null;
}

/**
 * Determine hard failure of either of firmware authenticity checks to block access to device.
 */
export const selectIsFirmwareAuthenticityCheckEnabledAndHardFailed = (state: AppState) => {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);

    return isHardRevisionCheckError(revisionError) || isHardHashCheckError(hashError);
};

/**
 * Return true if entropy check has failed and is not disabled via settings nor message system.
 */
export const selectIsEntropyCheckEnabledAndFailed = (state: AppState) => {
    const isEntropyCheckEnabled = selectIsEntropyCheckEnabled(state);
    const isEntropyCheckDisabledByMessageSystem = selectIsFeatureDisabled(
        state,
        Feature.entropyCheck,
    );
    const isEntropyCheckFailed = selectIsEntropyCheckFailed(state);

    return isEntropyCheckEnabled && !isEntropyCheckDisabledByMessageSystem && isEntropyCheckFailed;
};

export const selectIsDeviceIdCheckEnabledAndFailed = (state: AppState) => {
    const areDeviceMetaChecksEnabled = selectAreDeviceMetaChecksEnabled(state);
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.idCheck);
    const isDeviceIdValid = selectIsDeviceIdCheckSuccess(state);

    return areDeviceMetaChecksEnabled && !isDisabledByMessageSystem && !isDeviceIdValid;
};

export const selectIsDeviceInvariabilityEnabledAndFailed = (state: AppState) => {
    const areDeviceMetaChecksEnabled = selectAreDeviceMetaChecksEnabled(state);
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.invariabilityCheck);
    const isDeviceInvariabilityCheckSuccess = selectIsDeviceInvariabilityCheckSuccess(state);

    return (
        areDeviceMetaChecksEnabled &&
        !isDisabledByMessageSystem &&
        !isDeviceInvariabilityCheckSuccess
    );
};

export const selectShouldDisplayDeviceCompromised = (state: AppState): boolean => {
    // Entropy check won't be performed if disabled but we must also check it here to avoid showing the UI when the failed state is stored in database.
    const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(state);
    // Entropy check is not dismissable
    if (isEntropyCheckEnabledAndFailed) return true;

    // All following checks are dismissable
    const isFirmwareAuthenticityCheckDismissed = selectIsFirmwareAuthenticityCheckDismissed(state);
    if (isFirmwareAuthenticityCheckDismissed) return false;

    const isDeviceIdCheckFailed = selectIsDeviceIdCheckEnabledAndFailed(state);
    const isDeviceInvariabilityCheckFailed = selectIsDeviceInvariabilityEnabledAndFailed(state);
    const isFirmwareCheckEnabledAndFailed =
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state);

    return (
        isDeviceIdCheckFailed || isDeviceInvariabilityCheckFailed || isFirmwareCheckEnabledAndFailed
    );
};
