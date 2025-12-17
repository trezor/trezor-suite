import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectFirmwareUpdateSource } from '@suite-common/firmware';
import { ReportSecurityCheck, TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { FIRMWARE } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isArrayMember } from '@trezor/utils';

import { hashCheckErrorScenarios, revisionCheckErrorScenarios } from './scenariosConfig';

// to avoid unnecessary wallet-core import, and to facilitate platform-specific dependency injection
type CommonProps = {
    device: TrezorDevice | undefined;
    reportSecurityCheck: ReportSecurityCheck;
};

const useCommonData = ({ device }: Pick<CommonProps, 'device'>) => {
    const model = device?.features?.internal_model;
    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;

    return useMemo(
        () => ({ model, revision, version, vendor }),
        [model, revision, version, vendor],
    );
};

const useReportRevisionCheck = ({ device, reportSecurityCheck }: CommonProps) => {
    const commonData = useCommonData({ device });
    const firmwareSource = useSelector(selectFirmwareUpdateSource);

    const revisionCheck = isDeviceAcquired(device)
        ? device.authenticityChecks.firmwareRevision
        : null;
    const isError = revisionCheck && !revisionCheck.success;
    const errorType = isError ? revisionCheck.error : null;
    const errorPayload = isError ? revisionCheck.errorPayload : null;

    const shouldReport =
        firmwareSource === 'production' &&
        device?.connected === true &&
        errorType !== null &&
        revisionCheckErrorScenarios[errorType].shouldReport;

    useEffect(() => {
        if (shouldReport) {
            reportSecurityCheck({
                level: 'error',
                checkType: 'Firmware revision',
                contextData: { ...commonData, errorType },
                payload: errorPayload,
            });
        }
    }, [reportSecurityCheck, commonData, errorType, errorPayload, shouldReport]);
};

const useReportHashCheck = ({ device, reportSecurityCheck }: CommonProps) => {
    const commonData = useCommonData({ device });
    const firmwareSource = useSelector(selectFirmwareUpdateSource);

    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks.firmwareHash : null;
    const isError = hashCheck && !hashCheck.success;
    const errorType = isError ? hashCheck.error : null;
    const errorPayload = isError ? hashCheck.errorPayload : null;
    const attemptCount = isError ? hashCheck.attemptCount : null;

    const shouldReport =
        firmwareSource === 'production' &&
        device?.connected === true &&
        errorType !== null &&
        hashCheckErrorScenarios[errorType].shouldReport;

    useEffect(() => {
        if (shouldReport) {
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
        }
    }, [reportSecurityCheck, commonData, errorType, errorPayload, attemptCount, shouldReport]);

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
    }, [reportSecurityCheck, commonData, warningPayload]);
};

/**
 * Optionally report both FW authenticity checks (revision and hash) to Sentry and/or show toast notifications,
 * based on behavior scenarios definitions. This may happen even when no UI is displayed for the checks.
 */
export const useReportDeviceCompromised = (props: CommonProps) => {
    useReportRevisionCheck(props);
    useReportHashCheck(props);
};
