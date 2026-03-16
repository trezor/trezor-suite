import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type DeviceRootState,
    deviceInvariabilityCheck,
    getIsDeviceIdValid,
    selectPersistentDeviceDataById,
} from '@suite-common/device';
import { selectIsProductionFirmwareChannel } from '@suite-common/firmware';
import { type TrezorDevice } from '@suite-common/suite-types';
import { isDeviceKnown as getIsDeviceKnown, isDeviceAcquired } from '@suite-common/suite-utils';
import { FIRMWARE } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isArrayMember } from '@trezor/utils';

import { reportSecurityCheckThunk } from './reportSecurityCheckThunk';
import { hashCheckErrorScenarios, revisionCheckErrorScenarios } from './scenariosConfig';

// to avoid unnecessary wallet-core import
type CommonProps = {
    device: TrezorDevice | undefined;
    selectAllowPrerelease: (state: any) => boolean;
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

const useReportRevisionCheck = ({ device, selectAllowPrerelease }: CommonProps) => {
    const dispatch = useDispatch();
    const commonData = useCommonData({ device });
    const isProductionFirmwareChannel = useSelector(
        selectIsProductionFirmwareChannel(selectAllowPrerelease),
    );

    const revisionCheck = isDeviceAcquired(device)
        ? device.authenticityChecks.firmwareRevision
        : null;
    const isError = revisionCheck && !revisionCheck.success;
    const errorType = isError ? revisionCheck.error : null;
    const errorPayload = isError ? revisionCheck.errorPayload : null;

    const shouldReport =
        isProductionFirmwareChannel &&
        device?.connected === true &&
        errorType !== null &&
        revisionCheckErrorScenarios[errorType].shouldReport;

    useEffect(() => {
        if (shouldReport) {
            dispatch(
                reportSecurityCheckThunk({
                    level: 'error',
                    checkType: 'Firmware revision',
                    contextData: { ...commonData, errorType },
                    payload: errorPayload,
                }),
            );
        }
    }, [dispatch, commonData, errorType, errorPayload, shouldReport]);
};

const useReportHashCheck = ({ device, selectAllowPrerelease }: CommonProps) => {
    const dispatch = useDispatch();
    const commonData = useCommonData({ device });
    const isProductionFirmwareChannel = useSelector(
        selectIsProductionFirmwareChannel(selectAllowPrerelease),
    );

    const hashCheck = isDeviceAcquired(device) ? device.authenticityChecks.firmwareHash : null;
    const isError = hashCheck && !hashCheck.success;
    const errorType = isError ? hashCheck.error : null;
    const errorPayload = isError ? hashCheck.errorPayload : null;
    const attemptCount = isError ? hashCheck.attemptCount : null;

    const shouldReport =
        isProductionFirmwareChannel &&
        device?.connected === true &&
        errorType !== null &&
        hashCheckErrorScenarios[errorType].shouldReport;

    useEffect(() => {
        if (shouldReport) {
            const willBeRetried =
                isArrayMember(errorType, FIRMWARE.HASH_CHECK_RETRIABLE_ERRORS) &&
                (attemptCount ?? 0) < FIRMWARE.HASH_CHECK_MAX_ATTEMPTS;
            if (willBeRetried) return;

            dispatch(
                reportSecurityCheckThunk({
                    level: 'error',
                    checkType: 'Firmware hash',
                    contextData: { ...commonData, errorType, attemptCount },
                    payload: errorPayload,
                }),
            );
        }
    }, [dispatch, commonData, errorType, errorPayload, attemptCount, shouldReport]);

    // success bears warning if it needed retries, so we report the previous error payload, see Device.ts in connect
    const isHashCheckSuccess = hashCheck && hashCheck.success;
    const warningPayload = isHashCheckSuccess ? hashCheck.warningPayload : null;
    useEffect(() => {
        if (warningPayload) {
            dispatch(
                reportSecurityCheckThunk({
                    level: 'warning',
                    checkType: 'Firmware hash',
                    contextData: commonData,
                    payload: warningPayload,
                }),
            );
        }
    }, [dispatch, commonData, warningPayload]);
};

// Report meta check results (Id check & device invariability checks ) to Sentry
const useReportDeviceMetaChecks = ({ device }: CommonProps) => {
    const dispatch = useDispatch();
    const commonData = useCommonData({ device });
    const previousData = useSelector((state: DeviceRootState) =>
        selectPersistentDeviceDataById(state, device?.id),
    );
    const idCheckSuccess = getIsDeviceIdValid(device);

    const isDeviceKnown = getIsDeviceKnown(device);
    const isBootloaderMode = device?.features?.bootloader_mode === true;
    const currentModel = device?.features?.internal_model;
    const currentColor = device?.features?.unit_color;
    const hasPreviousRecord = previousData !== undefined;
    const previousModel = previousData?.internal_model;
    const previousColor = previousData?.unit_color;

    const invariabilityCheckResult = useMemo(
        () =>
            deviceInvariabilityCheck({
                isDeviceKnown,
                isBootloaderMode,
                currentModel,
                currentColor,
                hasPreviousRecord,
                previousModel,
                previousColor,
            }),
        [
            isDeviceKnown,
            isBootloaderMode,
            currentModel,
            currentColor,
            hasPreviousRecord,
            previousModel,
            previousColor,
        ],
    );

    useEffect(() => {
        if (!idCheckSuccess) {
            dispatch(
                reportSecurityCheckThunk({
                    level: 'error',
                    checkType: 'Device id',
                    contextData: commonData,
                }),
            );
        }
    }, [dispatch, commonData, idCheckSuccess]);
    useEffect(() => {
        if (!invariabilityCheckResult.success) {
            dispatch(
                reportSecurityCheckThunk({
                    level: 'error',
                    checkType: 'Device invariability',
                    contextData: commonData,
                    payload: invariabilityCheckResult.error,
                }),
            );
        }
    }, [dispatch, commonData, invariabilityCheckResult]);
};

/**
 * Optionally report both FW authenticity checks (revision and hash) to Sentry and/or show toast notifications,
 * based on behavior scenarios definitions. This may happen even when no UI is displayed for the checks.
 */
export const useReportDeviceCompromised = ({ device, selectAllowPrerelease }: CommonProps) => {
    useReportRevisionCheck({ device, selectAllowPrerelease });
    useReportHashCheck({ device, selectAllowPrerelease });
    useReportDeviceMetaChecks({ device, selectAllowPrerelease });
};
