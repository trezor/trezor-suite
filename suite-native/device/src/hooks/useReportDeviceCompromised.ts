import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { revisionCheckErrorScenarios } from '@suite-common/firmware-authenticity';
import { ReportSecurityCheckProps } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { captureSentryException, withSentryScope } from '@suite-native/sentry';
import { getFirmwareVersion } from '@trezor/device-utils';

export const reportSecurityCheck = ({
    level,
    checkType,
    contextData,
    payload,
}: ReportSecurityCheckProps) => {
    const levelDescription = level === 'error' ? 'failed' : 'warning';
    const exceptionName = level === 'error' ? 'reportCheckFail' : 'reportCheckWarning';
    const payloadLabel = `${checkType} check ${levelDescription}!`;

    withSentryScope(scope => {
        scope.setExtra(`${level}Payload`, payload);
        // The only way to do custom issue title is via Error.name
        const exceptionForSentry = new Error(`${payloadLabel} ${JSON.stringify(contextData)}`);
        exceptionForSentry.name = exceptionName;
        captureSentryException(exceptionForSentry, scope);
    });
};

const useCommonData = () => {
    const device = useSelector(selectSelectedDevice);
    const model = device?.features?.internal_model;
    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;

    return useMemo(
        () => ({ model, revision, version, vendor }),
        [model, revision, version, vendor],
    );
};

export const useReportDeviceCompromised = () => {
    const commonData = useCommonData();
    const device = useSelector(selectSelectedDevice);

    const revCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareRevision : null;
    const isError = revCheck && !revCheck.success;
    const errorType = isError ? revCheck.error : null;
    const errorPayload = isError ? revCheck.errorPayload : null;

    useEffect(() => {
        if (!errorType) return;
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
