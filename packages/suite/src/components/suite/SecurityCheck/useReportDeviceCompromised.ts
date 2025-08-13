import { useEffect, useMemo } from 'react';

import {
    hashCheckErrorScenarios,
    revisionCheckErrorScenarios,
} from '@suite-common/firmware-authenticity';
import { ReportSecurityCheckProps } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { FIRMWARE } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isArrayMember } from '@trezor/utils';

import { useDevice } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';

export const reportSecurityCheck = ({
    level,
    checkType,
    contextData,
    payload,
}: ReportSecurityCheckProps) => {
    const levelDescription = level === 'error' ? 'failed' : 'warning';
    const payloadLabel = `${checkType} check ${levelDescription}!`;
    console.warn(payloadLabel, contextData, payload);

    withSentryScope(scope => {
        scope.setLevel(level);
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check ${levelDescription}`);
        scope.setExtra(`${level}Payload`, payload);
        captureSentryMessage(`${payloadLabel} ${JSON.stringify(contextData)}`, scope);
    });
};

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

    const revisionCheck = isDeviceAcquired(device)
        ? device.authenticityChecks.firmwareRevision
        : null;
    const isError = revisionCheck && !revisionCheck.success;
    const errorType = isError ? revisionCheck.error : null;
    const errorPayload = isError ? revisionCheck.errorPayload : null;

    useEffect(() => {
        if (errorType === null) return;
        if (revisionCheckErrorScenarios[errorType].shouldReport) {
            reportSecurityCheck({
                level: 'error',
                checkType: 'Firmware revision',
                contextData: { ...commonData, errorType },
                payload: errorPayload,
            });
        }
    }, [commonData, errorType, errorPayload]);
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

        reportSecurityCheck({
            level: 'error',
            checkType: 'Firmware hash',
            contextData: { ...commonData, errorType, attemptCount },
            payload: errorPayload,
        });
    }, [commonData, errorType, errorPayload, attemptCount]);

    // success bears warning if it needed retries, so we report the previous error payload, see Device.ts in connect
    const isHashCheckSuccess = hashCheck && hashCheck.success;
    const warningPayload = isHashCheckSuccess ? hashCheck.warningPayload : null;
    useEffect(() => {
        if (warningPayload) {
            reportSecurityCheck({
                level: 'warning',
                checkType: 'Firmware hash',
                contextData: commonData,
                payload: warningPayload,
            });
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
