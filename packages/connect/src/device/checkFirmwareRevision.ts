import { isEqual } from '@trezor/utils/src/versionUtils';

import { PROTO } from '../constants';
import { downloadReleasesMetadata } from '../data/downloadReleasesMetadata';
import { FirmwareRelease, VersionArray } from '../types';
import { calculateRevisionForDevice } from './calculateRevisionForDevice';
import { FirmwareRevisionCheckError, FirmwareRevisionCheckResult } from '../types/device';

const isNodeJSNetworkError = (e: Error) => ['FetchError', 'AbortError'].includes(e.name);
const isReactNativeNetworkError = (e: Error) =>
    e.name === 'TypeError' && e.message.includes('Network request failed');

/**
 * Check if an error signifies a missing fetch response (meaning network connection loss or unavailable host).
 * This can only by correctly identified in nodeJS or React native runtimes (i.e. Suite Desktop main process, or Suite Lite).
 * In browser runtime (Suite Web), all fetch errors are lumped together as CORS errors, therefore indistinguishable.
 * (even a request that had no response is CORS error, since a non-existent response does not have CORS headers)
 */
const isNetworkError = (e: unknown): boolean => {
    if (!(e instanceof Error)) return false;

    return isNodeJSNetworkError(e) || isReactNativeNetworkError(e);
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

    return onlineReleases.find(onlineRelease => isEqual(onlineRelease.version, firmwareVersion));
};

const failFirmwareRevisionCheck = (
    error: FirmwareRevisionCheckError,
): Extract<FirmwareRevisionCheckResult, { success: false }> => ({ success: false, error });

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
            return isNetworkError(e)
                ? failFirmwareRevisionCheck('cannot-perform-check-offline')
                : failFirmwareRevisionCheck('other-error');
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
