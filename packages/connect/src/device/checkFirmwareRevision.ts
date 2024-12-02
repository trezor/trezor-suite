import { isEqual } from '@trezor/utils/src/versionUtils';

import { PROTO } from '../constants';
import { downloadReleasesMetadata } from '../data/downloadReleasesMetadata';
import { FirmwareRelease, VersionArray } from '../types';
import { FirmwareRevisionCheckError, FirmwareRevisionCheckResult } from '../types/device';
import { calculateRevisionForDevice } from './calculateRevisionForDevice';

/*
 * error names that signify unavailable internet connection, see https://github.com/node-fetch/node-fetch/blob/main/docs/ERROR-HANDLING.md
 * Only works in Suite Desktop, where `cross-fetch` uses `node-fetch` (nodeJS environment)
 * In Suite Web, the errors are unfortunately indistinguishable from other errors, because they are all lumped as CORS errors
 * (even a request that had no response is CORS error, since a non-existent response does not have CORS headers)
 */
const NODE_FETCH_OFFLINE_ERROR_NAMES = ['FetchError', 'AbortError'] as const;

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
        } catch (e) {
            if (NODE_FETCH_OFFLINE_ERROR_NAMES.includes(e.name)) {
                return failFirmwareRevisionCheck('cannot-perform-check-offline');
            }

            return failFirmwareRevisionCheck('other-error');
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
