import {
    isHardHashCheckError,
    isHardRevisionCheckError,
    isSkippedHashCheckError,
    isSkippedRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';
import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
    selectIsEntropyCheckFailed,
} from '@suite-common/wallet-core';

import { AppState } from 'src/types/suite';

import { selectIsEntropyCheckEnabled } from './suiteSelectors';

export const selectFirmwareRevisionCheckErrorIfEnabled = (state: AppState) => {
    const revisionCheckError = selectFirmwareRevisionCheckError(state);
    if (revisionCheckError === null) return null;
    if (isSkippedRevisionCheckError(revisionCheckError)) return null;

    const isFirmwareRevisionCheckDisabled =
        !state.suite.settings.enabledSecurityChecks.firmwareRevision;
    if (isFirmwareRevisionCheckDisabled) return null;

    const isDisabledByMessageSystem = selectIsFeatureDisabled(state, Feature.firmwareRevisionCheck);
    if (isDisabledByMessageSystem) return null;

    return revisionCheckError;
};

export const selectFirmwareHashCheckErrorIfEnabled = (state: AppState) => {
    const hashCheckError = selectFirmwareHashCheckError(state);
    if (hashCheckError === null) return null;
    if (isSkippedHashCheckError(hashCheckError)) return null;

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
