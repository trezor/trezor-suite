import type { FirmwareRelease, VersionArray } from '@trezor/device-utils';
import { serializeError, versionUtils } from '@trezor/utils';

import { PROTO } from '../constants';
import { calculateRevisionForDevice } from './calculateRevisionForDevice';
import { downloadReleasesMetadata } from '../data/downloadReleasesMetadata';
import { FirmwareRevisionCheckError, FirmwareRevisionCheckResult } from '../types/device';
import { HttpRequestError } from '../utils/assets-browser';

const isNotFoundError = (e: unknown): boolean =>
    e instanceof HttpRequestError && e.response.status === 404;

const isNodeJSOfflineError = (e: Error) => ['FetchError', 'AbortError'].includes(e.name);
const isReactNativeOfflineError = (e: Error) =>
    e.name === 'TypeError' && e.message.includes('Network request failed');

/**
 * Check if an error signifies a missing fetch response (meaning network connection loss or unavailable host).
 * This can only by correctly identified in nodeJS or React native runtimes (i.e. Suite Desktop main process, or Suite Lite).
 * In browser runtime (Suite Web), all fetch errors are lumped together as CORS errors, therefore indistinguishable.
 * (even a request that had no response is CORS error, since a non-existent response does not have CORS headers)
 */
const isOfflineError = (e: unknown): boolean => {
    if (!(e instanceof Error)) return false;

    return isNodeJSOfflineError(e) || isReactNativeOfflineError(e);
};

type GetOnlineReleaseMetadataParams = {
    firmwareVersion: VersionArray;
    internalModel: string;
};

const getOnlineReleaseMetadata = async ({
    firmwareVersion,
    internalModel,
}: GetOnlineReleaseMetadataParams): Promise<FirmwareRelease | undefined> => {
    const onlineReleases = await downloadReleasesMetadata({ internal_model: internalModel });

    return onlineReleases.find(onlineRelease =>
        versionUtils.isEqual(onlineRelease.version, firmwareVersion),
    );
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
}: CheckFirmwareRevisionParams): Promise<FirmwareRevisionCheckResult> => {
    if (expectedRevision === undefined) {
        if (firmwareVersion.length !== 3) {
            return failFirmwareRevisionCheck('firmware-version-unknown');
        }

        try {
            const onlineRelease = await getOnlineReleaseMetadata({
                firmwareVersion,
                internalModel,
            });

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
