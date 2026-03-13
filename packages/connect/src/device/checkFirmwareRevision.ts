import type { FirmwareType } from '@trezor/device-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { serializeError, versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { calculateRevisionForDevice } from './calculateRevisionForDevice';
import { getOnlineReleaseByVersion } from '../data/firmwareInfo';
import type { FirmwareRevisionCheckError, FirmwareRevisionCheckResult } from '../types/device';
import { HttpRequestError } from '../utils/assetUtils';

const isNotFoundError = (e: unknown): boolean =>
    e instanceof HttpRequestError && e.response.status === 404;

const isNodeJSOfflineError = (e: Error) => ['FetchError', 'AbortError'].includes(e.name);
const isReactNativeOfflineError = (e: Error) =>
    e.name === 'TypeError' && e.message.includes('Network request failed');
const isAbortControllerTimeout = (e: Error) =>
    e.message.includes('Aborted') ||
    e.name === 'AbortError' ||
    (e.name === 'TimeoutError' && e.message.includes('signal timed out'));

/**
 * Check if an error signifies a missing fetch response (meaning network connection loss or unavailable host).
 * This can only by correctly identified in nodeJS or React native runtimes (i.e. Suite Desktop main process, or Suite Mobile).
 * In browser runtime (Suite Web), all fetch errors are lumped together as CORS errors, therefore indistinguishable.
 * (even a request that had no response is CORS error, since a non-existent response does not have CORS headers).
 * Additionally, AbortController timeouts are also considered to be network issues.
 */
const isOfflineError = (e: unknown): boolean => {
    if (!(e instanceof Error)) return false;

    return isNodeJSOfflineError(e) || isReactNativeOfflineError(e) || isAbortControllerTimeout(e);
};

const failFirmwareRevisionCheck = (
    error: FirmwareRevisionCheckError,
    errorPayload?: unknown,
): Extract<FirmwareRevisionCheckResult, { success: false }> => ({
    success: false,
    error,
    ...(errorPayload ? { errorPayload } : null),
});

export type CheckFirmwareRevisionParams = {
    firmwareVersion: VersionArray;
    internalModel: PROTO.DeviceModelInternal;
    deviceRevision: string | null;
    expectedRevision: string | undefined;
    firmwareType: FirmwareType;
};

type DoRevisionsMatchParams = {
    deviceRevision: string | null;
    expectedCommitRevision: string;
    firmwareVersion: VersionArray;
};

const doRevisionsMatch = ({
    deviceRevision,
    expectedCommitRevision,
    firmwareVersion,
}: DoRevisionsMatchParams): boolean => {
    if (deviceRevision === null) {
        return false; // defensively, device MUST provide the revision
    }

    const adjustedExpected = calculateRevisionForDevice({
        commitRevision: expectedCommitRevision,
        version: firmwareVersion,
    });

    return adjustedExpected === deviceRevision;
};

export const checkFirmwareRevision = async ({
    firmwareVersion,
    internalModel,
    deviceRevision,
    expectedRevision,
    firmwareType,
}: CheckFirmwareRevisionParams): Promise<FirmwareRevisionCheckResult> => {
    if (expectedRevision === undefined) {
        if (!versionUtils.isVersionArray(firmwareVersion)) {
            return failFirmwareRevisionCheck('firmware-version-unknown');
        }

        try {
            const onlineRelease = await getOnlineReleaseByVersion(
                internalModel,
                firmwareVersion,
                firmwareType,
            );

            if (onlineRelease?.firmware_revision === undefined) {
                return failFirmwareRevisionCheck('firmware-version-unknown');
            }

            if (
                !doRevisionsMatch({
                    deviceRevision,
                    expectedCommitRevision: onlineRelease.firmware_revision,
                    firmwareVersion,
                })
            ) {
                return failFirmwareRevisionCheck('revision-mismatch');
            }

            return { success: true };
        } catch (e: unknown) {
            // 404 means an unrecognized device model, so it cannot be an officially released firmware.
            // The model might be defined in local files, but important is, if it's been released to data.trezor.io
            if (isNotFoundError(e)) return failFirmwareRevisionCheck('firmware-version-unknown');

            return isOfflineError(e)
                ? failFirmwareRevisionCheck('cannot-perform-check-offline')
                : failFirmwareRevisionCheck('other-error', serializeError(e));
        }
    }

    if (
        !doRevisionsMatch({
            deviceRevision,
            expectedCommitRevision: expectedRevision,
            firmwareVersion,
        })
    ) {
        return failFirmwareRevisionCheck('revision-mismatch');
    }

    return { success: true };
};
