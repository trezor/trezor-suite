import { useEffect, useMemo } from 'react';

import { getFirmwareVersion } from '@trezor/device-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { useDevice, useSelector } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
} from 'src/reducers/suite/suiteReducer';

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
    const commonData = useCommonData();
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckError);

    useEffect(() => {
        if (revisionCheckError !== null) {
            reportCheckFail('revision', { ...commonData, revisionCheckError });
        }
    }, [commonData, revisionCheckError]);
};

const useReportHashCheck = () => {
    const { device } = useDevice();
    const commonData = useCommonData();

    const hashCheckError = useSelector(selectFirmwareHashCheckError);
    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareHash : null;
    const hashCheckErrorPayload = hashCheck?.success === false ? hashCheck.errorPayload : null;

    useEffect(() => {
        if (hashCheckError !== null) {
            reportCheckFail('hash', { ...commonData, hashCheckError, hashCheckErrorPayload });
        }
    }, [commonData, hashCheckError, hashCheckErrorPayload]);
};

export const useReportDeviceCompromised = () => {
    useReportRevisionCheck();
    useReportHashCheck();
};
