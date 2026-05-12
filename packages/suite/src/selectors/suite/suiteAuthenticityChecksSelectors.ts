import {
    selectAreDeviceMetaChecksEnabled,
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from '@suite/settings';
import {
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
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type AppState } from 'src/types/suite';

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

const selectIsEntropyFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.entropyCheck);
const selectIsIdCheckFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.idCheck);
const selectIsInvariabilityCheckFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.invariabilityCheck);
const selectIsFirmwareRevisionCheckFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.firmwareRevisionCheck);
const selectIsFirmwareHashCheckFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.firmwareHashCheck);
const selectIsFirmwareHashCheckOtherErrorFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.firmwareHashCheckOtherError);
const selectIsFirmwareHashCheckTimeoutFeatureDisabled = (state: AppState) =>
    selectIsFeatureDisabled(state, Feature.firmwareHashCheckTimeout);

const selectIsEntropyCheckFailedForSelectedDevice = (state: AppState) => {
    const device = selectSelectedDevice(state);

    return selectIsEntropyCheckFailed(state, device?.id);
};

const selectIsDeviceInvariabilityCheckSuccessForSelectedDevice = (state: AppState) => {
    const device = selectSelectedDevice(state);

    return selectIsDeviceInvariabilityCheckSuccess(state, device);
};

const selectIsFirmwareAuthenticityCheckDismissedForSelectedDevice = (state: AppState) => {
    const device = selectSelectedDevice(state);

    return selectIsFirmwareAuthenticityCheckDismissed(state, device?.id);
};

export const selectFirmwareRevisionCheckErrorIfEnabled = createMemoizedSelector(
    [
        selectSelectedDevice,
        selectIsFirmwareRevisionCheckEnabled,
        selectIsFirmwareRevisionCheckFeatureDisabled,
    ],
    (device, isFirmwareRevisionCheckEnabled, isDisabledByMessageSystem) => {
        const { revisionCheckError } = getFirmwareAuthenticityCheckErrors(device);
        if (revisionCheckError === null) return null;
        if (getIsSkippedRevisionCheckError(revisionCheckError)) return null;
        if (!isFirmwareRevisionCheckEnabled) return null;
        if (isDisabledByMessageSystem) return null;

        return revisionCheckError;
    },
);

export const selectFirmwareHashCheckErrorIfEnabled = createMemoizedSelector(
    [
        selectSelectedDevice,
        selectIsFirmwareHashCheckEnabled,
        selectIsFirmwareHashCheckFeatureDisabled,
        selectIsFirmwareHashCheckOtherErrorFeatureDisabled,
        selectIsFirmwareHashCheckTimeoutFeatureDisabled,
    ],
    (
        device,
        isFirmwareHashCheckEnabled,
        isDisabledByMessageSystem,
        isOtherErrorFeatureDisabled,
        isTimeoutFeatureDisabled,
    ) => {
        const { hashCheckError } = getFirmwareAuthenticityCheckErrors(device);
        if (hashCheckError === null) return null;
        if (getIsSkippedHashCheckError(hashCheckError)) return null;
        if (!isFirmwareHashCheckEnabled) return null;
        if (isDisabledByMessageSystem) return null;
        if (hashCheckError === 'other-error' && isOtherErrorFeatureDisabled) return null;
        if (hashCheckError === 'takes-too-long' && isTimeoutFeatureDisabled) return null;

        return hashCheckError;
    },
);

export const selectIsDeviceCompromised = createMemoizedSelector(
    [selectFirmwareRevisionCheckErrorIfEnabled, selectFirmwareHashCheckErrorIfEnabled],
    (revisionError, hashError): boolean => revisionError !== null || hashError !== null,
);

/**
 * Determine hard failure of either of firmware authenticity checks to block access to device.
 */
export const selectIsFirmwareAuthenticityCheckEnabledAndHardFailed = createMemoizedSelector(
    [selectFirmwareRevisionCheckErrorIfEnabled, selectFirmwareHashCheckErrorIfEnabled],
    (revisionError, hashError) =>
        getIsHardRevisionCheckError(revisionError) || getIsHardHashCheckError(hashError),
);

/**
 * Return true if entropy check has failed and is not disabled via settings nor message system.
 */
export const selectIsEntropyCheckEnabledAndFailed = createMemoizedSelector(
    [
        selectIsEntropyCheckEnabled,
        selectIsEntropyFeatureDisabled,
        selectIsEntropyCheckFailedForSelectedDevice,
    ],
    (isEntropyCheckEnabled, isEntropyCheckDisabledByMessageSystem, isEntropyCheckFailed) =>
        isEntropyCheckEnabled && !isEntropyCheckDisabledByMessageSystem && isEntropyCheckFailed,
);

export const selectIsDeviceIdCheckEnabledAndFailed = createMemoizedSelector(
    [selectSelectedDevice, selectAreDeviceMetaChecksEnabled, selectIsIdCheckFeatureDisabled],
    (device, areDeviceMetaChecksEnabled, isDisabledByMessageSystem) =>
        areDeviceMetaChecksEnabled && !isDisabledByMessageSystem && !getIsDeviceIdValid(device),
);

export const selectIsDeviceInvariabilityEnabledAndFailed = createMemoizedSelector(
    [
        selectAreDeviceMetaChecksEnabled,
        selectIsInvariabilityCheckFeatureDisabled,
        selectIsDeviceInvariabilityCheckSuccessForSelectedDevice,
    ],
    (areDeviceMetaChecksEnabled, isDisabledByMessageSystem, isDeviceInvariabilityCheckSuccess) =>
        areDeviceMetaChecksEnabled &&
        !isDisabledByMessageSystem &&
        !isDeviceInvariabilityCheckSuccess,
);

export const selectShouldDisplayDeviceCompromised = createMemoizedSelector(
    [
        selectIsEntropyCheckEnabledAndFailed,
        selectIsFirmwareAuthenticityCheckDismissedForSelectedDevice,
        selectIsDeviceIdCheckEnabledAndFailed,
        selectIsDeviceInvariabilityEnabledAndFailed,
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    ],
    (
        isEntropyCheckEnabledAndFailed,
        isFirmwareAuthenticityCheckDismissed,
        isDeviceIdCheckFailed,
        isDeviceInvariabilityCheckFailed,
        isFirmwareCheckEnabledAndFailed,
    ): boolean => {
        // Entropy check won't be performed if disabled but we must also check it here to avoid showing the UI when the failed state is stored in database.
        // Entropy check is not dismissable
        if (isEntropyCheckEnabledAndFailed) return true;

        // All the following checks are dismissable together by a shared mechanism
        if (isFirmwareAuthenticityCheckDismissed) return false;

        return (
            isDeviceIdCheckFailed ||
            isDeviceInvariabilityCheckFailed ||
            isFirmwareCheckEnabledAndFailed
        );
    },
);
