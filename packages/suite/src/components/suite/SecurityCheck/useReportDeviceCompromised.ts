import { useEffect, useMemo } from 'react';

import { getFirmwareVersion } from '@trezor/device-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { isArrayMember } from '@trezor/utils';

import { useDevice, useSelector } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import { selectFirmwareRevisionCheckError } from 'src/reducers/suite/suiteReducer';
import {
    skippedButReportedHashCheckErrors,
    skippedHashCheckErrors,
} from 'src/constants/suite/firmware';

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

    // `errorPayload` must also be extracted, which is why `selectFirmwareHashCheckError` would be impractical
    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareHash : null;
    const isHashCheckError = hashCheck && !hashCheck.success;
    const hashCheckError = isHashCheckError ? hashCheck.error : null;
    const hashCheckErrorPayload = isHashCheckError ? hashCheck.errorPayload : null;

    useEffect(() => {
        if (!hashCheckError) return;
        if (
            isArrayMember(hashCheckError, skippedHashCheckErrors) &&
            !isArrayMember(hashCheckError, skippedButReportedHashCheckErrors)
        ) {
            return;
        }

        reportCheckFail('hash', { ...commonData, hashCheckError, hashCheckErrorPayload });
    }, [commonData, hashCheckError, hashCheckErrorPayload]);
};

export const useReportDeviceCompromised = () => {
    useReportRevisionCheck();
    useReportHashCheck();
};
