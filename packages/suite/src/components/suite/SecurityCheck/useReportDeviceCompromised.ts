import { useEffect, useMemo } from 'react';

import { getFirmwareVersion } from '@trezor/device-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { useDevice, useSelector } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import { selectFirmwareRevisionCheckError } from 'src/reducers/suite/suiteReducer';
import { hashCheckErrorScenarios } from 'src/constants/suite/firmware';

export const reportCheckFail = (
    checkType: 'Firmware revision' | 'Firmware hash' | 'Entropy',
    contextData: Record<string, any>,
    errorPayload?: unknown,
) => {
    const payloadLabel = `${checkType} check failed!`;
    console.warn(payloadLabel, contextData, errorPayload);

    withSentryScope(scope => {
        scope.setLevel('error');
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check failed`);
        scope.setExtra('errorPayload', errorPayload);
        captureSentryMessage(`${payloadLabel} ${JSON.stringify(contextData)}`, scope);
    });
};

const reportCheckWarning = (
    checkType: 'Firmware revision' | 'Firmware hash',
    contextData: Record<string, any>,
    warningPayload?: unknown,
) => {
    const payloadLabel = `${checkType} check warning!`;
    console.warn(payloadLabel, contextData, warningPayload);

    withSentryScope(scope => {
        scope.setLevel('warning');
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check warning`);
        scope.setExtra('warningPayload', warningPayload);
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
    const errorType = useSelector(selectFirmwareRevisionCheckError);

    useEffect(() => {
        if (errorType !== null) {
            reportCheckFail('Firmware revision', { ...commonData, errorType });
        }
    }, [commonData, errorType]);
};

const useReportHashCheck = () => {
    const { device } = useDevice();
    const commonData = useCommonData();

    // `errorPayload` must also be extracted, which is why `selectFirmwareHashCheckError` would be impractical
    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareHash : null;
    const isError = hashCheck && !hashCheck.success;
    const errorType = isError ? hashCheck.error : null;
    const errorPayload = isError ? hashCheck.errorPayload : null;
    const attemptCount = isError ? hashCheck.attemptCount : null;

    useEffect(() => {
        if (errorType && hashCheckErrorScenarios[errorType].shouldReport) {
            reportCheckFail(
                'Firmware hash',
                { ...commonData, errorType, attemptCount },
                errorPayload,
            );
        }
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

export const useReportDeviceCompromised = () => {
    useReportRevisionCheck();
    useReportHashCheck();
};
