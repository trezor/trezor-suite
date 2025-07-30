import { useEffect, useMemo } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { FirmwareCheckType } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { FIRMWARE } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isArrayMember } from '@trezor/utils';

import {
    RevisionCheckErrorWithNotification,
    hashCheckErrorScenarios,
    isRevisionCheckErrorWithNotification,
    revisionCheckErrorScenarios,
} from 'src/constants/suite/firmware';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';

const revisionCheckNotifications: Record<RevisionCheckErrorWithNotification, TranslationKey> = {
    'other-error': 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
};

const reportCheck = (
    level: 'error' | 'warning',
    checkType: FirmwareCheckType,
    contextData: Record<string, any>,
    payload?: unknown,
) => {
    const action = level === 'error' ? 'failed' : 'warning';
    const payloadLabel = `${checkType} check ${action}!`;
    console.warn(payloadLabel, contextData, payload);

    withSentryScope(scope => {
        scope.setLevel(level);
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check ${action}`);
        scope.setExtra(`${level}Payload`, payload);
        captureSentryMessage(`${payloadLabel} ${JSON.stringify(contextData)}`, scope);
    });
};

export const reportCheckFail = (
    checkType: FirmwareCheckType,
    contextData: Record<string, any>,
    errorPayload?: unknown,
) => reportCheck('error', checkType, contextData, errorPayload);

const reportCheckWarning = (
    checkType: 'Firmware hash' | 'Firmware revision',
    contextData: Record<string, any>,
    warningPayload?: unknown,
) => reportCheck('warning', checkType, contextData, warningPayload);

const useCommonData = () => {
    const { device } = useDevice();
    const model = device?.features?.internal_model;
    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;

    return useMemo(
        () => ({ model, revision, version, vendor }),
        [model, revision, version, vendor],
    );
};

const useReportRevisionCheck = () => {
    const commonData = useCommonData();
    const { device } = useDevice();
    const dispatch = useDispatch();

    const revisionCheck = isDeviceAcquired(device)
        ? device.authenticityChecks.firmwareRevision
        : null;
    const isError = revisionCheck && !revisionCheck.success;
    const errorType = isError ? revisionCheck.error : null;
    const errorPayload = isError ? revisionCheck.errorPayload : null;

    useEffect(() => {
        if (errorType === null) return;
        if (revisionCheckErrorScenarios[errorType].shouldReport) {
            reportCheckFail('Firmware revision', { ...commonData, errorType }, errorPayload);
        }
    }, [commonData, errorType, errorPayload]);

    useEffect(() => {
        if (errorType === null) return;
        if (isRevisionCheckErrorWithNotification(errorType)) {
            dispatch(
                notificationsActions.addToast({
                    type: 'firmware-authenticity-check-error',
                    translationKey: revisionCheckNotifications[errorType],
                }),
            );
        }
    }, [dispatch, errorType]);
};

const useReportHashCheck = () => {
    const { device } = useDevice();
    const commonData = useCommonData();

    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks.firmwareHash : null;
    const isError = hashCheck && !hashCheck.success;
    const errorType = isError ? hashCheck.error : null;
    const errorPayload = isError ? hashCheck.errorPayload : null;
    const attemptCount = isError ? hashCheck.attemptCount : null;

    useEffect(() => {
        if (errorType === null) return;
        if (!hashCheckErrorScenarios[errorType].shouldReport) return;
        const willBeRetried =
            isArrayMember(errorType, FIRMWARE.HASH_CHECK_RETRIABLE_ERRORS) &&
            (attemptCount ?? 0) < FIRMWARE.HASH_CHECK_MAX_ATTEMPTS;
        if (willBeRetried) return;

        reportCheckFail('Firmware hash', { ...commonData, errorType, attemptCount }, errorPayload);
    }, [commonData, errorType, errorPayload, attemptCount]);

    // success bears warning if it needed retries, so we report the previous error payload, see Device.ts in connect
    const isHashCheckSuccess = hashCheck && hashCheck.success;
    const warningPayload = isHashCheckSuccess ? hashCheck.warningPayload : null;
    useEffect(() => {
        if (warningPayload) {
            reportCheckWarning('Firmware hash', commonData, warningPayload);
        }
    }, [commonData, warningPayload]);
};

/**
 * Optionally report both FW authenticity checks (revision and hash) to Sentry and/or show toast notifications,
 * based on behavior scenarios definitions. This may happen even when no UI is displayed for the checks.
 */
export const useReportDeviceCompromised = () => {
    useReportRevisionCheck();
    useReportHashCheck();
};
