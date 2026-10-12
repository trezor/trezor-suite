import { type RouterRootState, selectRouterApp } from '@suite/router';
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
    selectIsDiscoveryEntropyCheckDismissed,
    selectIsFirmwareAuthenticityCheckDismissed,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    getFirmwareAuthenticityCheckErrors,
    getIsHardHashCheckError,
    getIsHardRevisionCheckError,
    getIsRetriableRevisionCheckError,
    getIsSkippedHashCheckError,
    getIsSkippedRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import {
    type PersistentDeviceDataRootState,
    selectIsDeviceInvariabilityCheckSuccess,
    selectIsDiscoveryEntropyCheckFailed,
    selectIsEntropyCheckFailed,
} from '@suite-common/persistent-device-data';

import { SHOULD_ROUTER_APP_SKIP_AUTHENTICITY_CHECKS } from './config';

export type AuthenticityChecksRootState = SuiteSettingsRootState &
    DeviceRootState &
    PersistentDeviceDataRootState &
    MessageSystemRootState &
    RouterRootState;

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

export const selectShouldRetryFirmwareRevisionCheckError = (
    state: AuthenticityChecksRootState,
): boolean => getIsRetriableRevisionCheckError(selectFirmwareRevisionCheckErrorIfEnabled(state));

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
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.entropyCheck);
    const isEntropyCheckFailed = selectIsEntropyCheckFailed(state, device?.id);

    return isEntropyCheckEnabled && !isDisabledByMessageSystem && isEntropyCheckFailed;
};

/**
 * Return true if discovery entropy check has failed and is not disabled via settings nor message system.
 * Dismissal is not taken into account.
 */
export const selectIsDiscoveryEntropyCheckEnabledAndFailed = (
    state: AuthenticityChecksRootState,
) => {
    const device = selectSelectedDevice(state);
    const isEntropyCheckEnabled = selectIsEntropyCheckEnabled(state);
    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.entropyCheckDiscovery);
    const isDiscoveryEntropyCheckFailed = selectIsDiscoveryEntropyCheckFailed(state, device?.id);

    return isEntropyCheckEnabled && !isDisabledByMessageSystem && isDiscoveryEntropyCheckFailed;
};

export const selectIsDiscoveryEntropyCheckEnabledAndUndismissedFailed = (
    state: AuthenticityChecksRootState,
) => {
    const device = selectSelectedDevice(state);
    const isDismissed = selectIsDiscoveryEntropyCheckDismissed(state, device?.id);

    return !isDismissed && selectIsDiscoveryEntropyCheckEnabledAndFailed(state);
};

/**
 * Whether any of the dismissable checks is failing and not dismissed.
 * This selector is intended to alter the UI after dismissing a dismissable check, e.g. disable trade with a warning.
 * TODO rename, include other checks for completeness.
 */
export function selectIsDeviceCompromised(state: AuthenticityChecksRootState): boolean {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);
    const isDiscoveryEntropyCheckFailed = selectIsDiscoveryEntropyCheckEnabledAndFailed(state);

    return revisionError !== null || hashError !== null || isDiscoveryEntropyCheckFailed;
}

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

    // The following checks are dismissible together by a shared mechanism.
    const device = selectSelectedDevice(state);
    const isFirmwareAuthenticityCheckDismissed = selectIsFirmwareAuthenticityCheckDismissed(
        state,
        device?.id,
    );
    if (!isFirmwareAuthenticityCheckDismissed) {
        const isDeviceIdCheckFailed = selectIsDeviceIdCheckEnabledAndFailed(state);
        const isDeviceInvariabilityCheckFailed = selectIsDeviceInvariabilityEnabledAndFailed(state);
        const isFirmwareCheckEnabledAndFailed =
            selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state);

        if (
            isDeviceIdCheckFailed ||
            isDeviceInvariabilityCheckFailed ||
            isFirmwareCheckEnabledAndFailed
        ) {
            return true;
        }
    }

    // Discovery entropy check is dismissible separately.
    return selectIsDiscoveryEntropyCheckEnabledAndUndismissedFailed(state);
};

export const selectShouldRouterAppSkipAuthenticityCheck = (state: RouterRootState): boolean =>
    SHOULD_ROUTER_APP_SKIP_AUTHENTICITY_CHECKS[selectRouterApp(state)];

export const selectShouldDisplayDeviceCompromisedOnRoute = (
    state: AuthenticityChecksRootState,
): boolean =>
    !selectShouldRouterAppSkipAuthenticityCheck(state) &&
    selectShouldDisplayDeviceCompromised(state);
