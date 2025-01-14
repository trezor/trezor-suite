import { useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';

import * as Sentry from '@sentry/react-native';

import { getFirmwareVersion } from '@trezor/device-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { selectFirmwareRevisionCheckError } from '../selectors';

const reportCheckFail = (checkType: 'Firmware revision', contextData: any) => {
    Sentry.captureException(`${checkType} check failed! ${JSON.stringify(contextData)}`);
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

    const revisionCheckError = useSelector(selectFirmwareRevisionCheckError);

    useEffect(() => {
        if (revisionCheckError !== null) {
            reportCheckFail('Firmware revision', { ...commonData, revisionCheckError });
        }
    }, [commonData, revisionCheckError]);
};
