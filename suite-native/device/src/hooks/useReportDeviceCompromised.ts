import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { captureSentryException, withSentryScope } from '@suite-native/sentry';
import { getFirmwareVersion } from '@trezor/device-utils';

import { revisionCheckErrorScenarios } from '../config/firmware';

export const reportCheckFail = (
    checkType: 'Entropy' | 'Firmware revision',
    contextData: Record<string, any>,
    errorPayload?: unknown,
) => {
    const payloadLabel = `${checkType} check failed!`;
    withSentryScope(scope => {
        scope.setExtra('errorPayload', errorPayload);
        const exceptionForSentry = new Error(`${payloadLabel} ${JSON.stringify(contextData)}`);
        exceptionForSentry.name = 'reportCheckFail'; // Custom issue title
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
            reportCheckFail('Firmware revision', { ...commonData, errorType }, errorPayload);
        }
    }, [commonData, errorType, errorPayload]);
};
