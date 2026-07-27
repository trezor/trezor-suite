import {
    type SuiteSettingsRootState,
    selectAreDeviceMetaChecksEnabled,
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from '@suite/settings';
import {
    type DeviceRootState,
    getIsDeviceIdValid,
    selectIsDeviceInvariabilityCheckSuccess,
    selectIsEntropyCheckFailed,
    selectIsFirmwareAuthenticityCheckDismissed,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    getFirmwareAuthenticityCheckErrors,
    getIsHardHashCheckError,
    getIsHardRevisionCheckError,
    getIsSkippedHashCheckError,
    getIsSkippedRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';

export type AuthenticityChecksRootState = SuiteSettingsRootState &
    DeviceRootState &
    MessageSystemRootState;

export const selectFirmwareRevisionCheckErrorIfEnabled = (state: AuthenticityChecksRootState) => {
    const device = selectSelectedDevice(state);
    const { revisionCheckError } = getFirmwareAuthenticityCheckErrors(device);
    if (revisionCheckError === null) return null;
    if (getIsSkippedRevisionCheckError(revisionCheckError)) return null;

    const isFirmwareRevisionCheckDisabled = !selectIsFirmwareRevisionCheckEnabled(state);
    if (isFirmwareRevisionCheckDisabled) return null;

    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.firmwareRevisionCheck);
    if (isDisabledByMessageSystem) return null;

    return revisionCheckError;
};

export const selectFirmwareHashCheckErrorIfEnabled = (state: AuthenticityChecksRootState) => {
    const device = selectSelectedDevice(state);
    const { hashCheckError } = getFirmwareAuthenticityCheckErrors(device);
    if (hashCheckError === null) return null;
    if (getIsSkippedHashCheckError(hashCheckError)) return null;

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

export function selectIsDeviceCompromised(state: AuthenticityChecksRootState): boolean {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);

    return revisionError !== null || hashError !== null;
}

/**
 * Determine hard failure of either of firmware authenticity checks to block access to device.
 */
export const selectIsFirmwareAuthenticityCheckEnabledAndHardFailed = (
    state: AuthenticityChecksRootState,
) => {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);

    return getIsHardRevisionCheckError(revisionError) || getIsHardHashCheckError(hashError);
};

/**
 * Return true if entropy check has failed and is not disabled via settings nor message system.
 */
export const selectIsEntropyCheckEnabledAndFailed = (state: AuthenticityChecksRootState) => {
    const device = selectSelectedDevice(state);
    const isEntropyCheckEnabled = selectIsEntropyCheckEnabled(state);
    const isEntropyCheckDisabledByMessageSystem = selectIsFeatureDisabled(
        state,
        Feature.entropyCheck,
    );
    const isEntropyCheckFailed = selectIsEntropyCheckFailed(state, device?.id);

    return isEntropyCheckEnabled && !isEntropyCheckDisabledByMessageSystem && isEntropyCheckFailed;
};

export const selectIsDeviceIdCheckEnabledAndFailed = (state: AuthenticityChecksRootState) => {
    const device = selectSelectedDevice(state);
    const areDeviceMetaChecksEnabled = selectAreDeviceMetaChecksEnabled(state);
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.idCheck);
    const isDeviceIdValid = getIsDeviceIdValid(device);

    return areDeviceMetaChecksEnabled && !isDisabledByMessageSystem && !isDeviceIdValid;
};

export const selectIsDeviceInvariabilityEnabledAndFailed = (state: AuthenticityChecksRootState) => {
    const device = selectSelectedDevice(state);
    const areDeviceMetaChecksEnabled = selectAreDeviceMetaChecksEnabled(state);
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.invariabilityCheck);
    const isDeviceInvariabilityCheckSuccess = selectIsDeviceInvariabilityCheckSuccess(
        state,
        device,
    );

    return (
        areDeviceMetaChecksEnabled &&
        !isDisabledByMessageSystem &&
        !isDeviceInvariabilityCheckSuccess
    );
};

export const selectShouldDisplayDeviceCompromised = (
    state: AuthenticityChecksRootState,
): boolean => {
    // Entropy check won't be performed if disabled but we must also check it here to avoid showing the UI when the failed state is stored in database.
    const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(state);
    // Entropy check is not dismissible.
    if (isEntropyCheckEnabledAndFailed) return true;

    // All the following checks are dismissible together by a shared mechanism.
    const device = selectSelectedDevice(state);
    const isFirmwareAuthenticityCheckDismissed = selectIsFirmwareAuthenticityCheckDismissed(
        state,
        device?.id,
    );
    if (isFirmwareAuthenticityCheckDismissed) return false;

    const isDeviceIdCheckFailed = selectIsDeviceIdCheckEnabledAndFailed(state);
    const isDeviceInvariabilityCheckFailed = selectIsDeviceInvariabilityEnabledAndFailed(state);
    const isFirmwareCheckEnabledAndFailed =
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state);

    return (
        isDeviceIdCheckFailed || isDeviceInvariabilityCheckFailed || isFirmwareCheckEnabledAndFailed
    );
};
