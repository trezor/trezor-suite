import { useEffect, useMemo } from 'react';

import { getFirmwareVersion } from '@trezor/device-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { useDevice } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';

const reportCheckFail = (checkType: 'revision' | 'hash', contextData: any) =>
    withSentryScope(scope => {
        scope.setLevel('error');
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check failed`);
        captureSentryMessage(
            `Firmware ${checkType} check failed! ${JSON.stringify(contextData)}`,
            scope,
        );
    });

const useCommonData = () => {
    const { device } = useDevice();
    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;

    return useMemo(() => ({ revision, version, vendor }), [revision, version, vendor]);
};

const useReportRevisionCheck = () => {
    const { device } = useDevice();
    const commonData = useCommonData();

    const revisionCheck = isDeviceAcquired(device)
        ? device.authenticityChecks?.firmwareRevision
        : null;
    const isRevisionCheckError = revisionCheck && !revisionCheck.success;
    const revisionCheckError = isRevisionCheckError ? revisionCheck.error : null;

    useEffect(() => {
        if (!isRevisionCheckError) return;
        reportCheckFail('revision', { ...commonData, revisionCheckError });
    }, [commonData, isRevisionCheckError, revisionCheckError]);
};

const useReportHashCheck = () => {
    const { device } = useDevice();
    const commonData = useCommonData();

    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareHash : null;
    const isHashCheckError = hashCheck && !hashCheck.success;
    const hashCheckError = isHashCheckError ? hashCheck.error : null;
    const hashCheckErrorPayload = isHashCheckError ? hashCheck.errorPayload : null;

    useEffect(() => {
        if (!isHashCheckError) return;
        reportCheckFail('hash', { ...commonData, hashCheckError, hashCheckErrorPayload });
    }, [commonData, hashCheckError, isHashCheckError, hashCheckErrorPayload]);
};

export const useReportDeviceCompromised = () => {
    useReportRevisionCheck();
    useReportHashCheck();
};
