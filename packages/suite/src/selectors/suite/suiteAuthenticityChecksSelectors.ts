import {
    hashCheckErrorScenarios,
    isSkippedHashCheckError,
    isSkippedRevisionCheckError,
    revisionCheckErrorScenarios,
} from '@suite-common/firmware-authenticity';
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectIsEntropyCheckFailed, selectSelectedDevice } from '@suite-common/wallet-core';

import { AppState } from 'src/types/suite';

import { selectIsEntropyCheckEnabled } from './suiteSelectors';

/**
 * Get firmware revision check error, or null if check was successful / skipped.
 */
export const selectFirmwareRevisionCheckError = (state: AppState) => {
    const device = selectSelectedDevice(state);
    if (!isDeviceAcquired(device) || !device.authenticityChecks) return null;
    const checkResult = device.authenticityChecks.firmwareRevision;

    // null means not performed, then don't consider it failed
    if (!checkResult || checkResult.success) return null;

    if (isSkippedRevisionCheckError(checkResult.error)) return null;

    return checkResult.error;
};

export const selectFirmwareRevisionCheckErrorIfEnabled = (state: AppState) => {
    const revisionCheckError = selectFirmwareRevisionCheckError(state);
    if (revisionCheckError === null) return null;

    const isFirmwareRevisionCheckDisabled =
        !state.suite.settings.enabledSecurityChecks.firmwareRevision;
    if (isFirmwareRevisionCheckDisabled) return null;

    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.firmwareRevisionCheck);
    if (isDisabledByMessageSystem) return null;

    return revisionCheckError;
};

/**
 * Get firmware hash check error, or null if check was successful / skipped.
 */
export const selectFirmwareHashCheckError = (state: AppState) => {
    const device = selectSelectedDevice(state);
    if (!isDeviceAcquired(device) || !device.authenticityChecks) return null;
    const checkResult = device.authenticityChecks.firmwareHash;

    // null means not performed, then don't consider it failed
    if (!checkResult || checkResult.success) return null;

    if (isSkippedHashCheckError(checkResult.error)) return null;

    return checkResult.error;
};

export const selectFirmwareHashCheckErrorIfEnabled = (state: AppState) => {
    const hashCheckError = selectFirmwareHashCheckError(state);
    if (hashCheckError === null) return null;

    const isFirmwareHashCheckDisabled = !state.suite.settings.enabledSecurityChecks.firmwareHash;
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
export const selectIsFirmwareAuthenticityCheckEnabledAndHardFailed = (state: AppState) => {
    const revisionError = selectFirmwareRevisionCheckErrorIfEnabled(state);
    const isRevisionHardError =
        revisionError !== null && revisionCheckErrorScenarios[revisionError].type === 'hardModal';

    const hashError = selectFirmwareHashCheckErrorIfEnabled(state);
    const isHashHardError =
        hashError !== null && hashCheckErrorScenarios[hashError].type === 'hardModal';

    return isRevisionHardError || isHashHardError;
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
