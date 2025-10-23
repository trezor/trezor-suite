import type {
    FirmwareRevisionCheckError,
    FirmwareRevisionCheckResult,
} from '@trezor/connect-common/src/types/device';
import type { FirmwareType } from '@trezor/device-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { serializeError, versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { calculateRevisionForDevice } from './calculateRevisionForDevice';
import { getOnlineReleaseByVersion } from '../data/firmwareInfo';
import { HttpRequestError } from '../utils/assetUtils';

const isNotFoundError = (e: unknown): boolean =>
    e instanceof HttpRequestError && e.response.status === 404;

// System error codes that signify a missing connection or unreachable host.
const NODEJS_NETWORK_ERROR_CODES = [
    'ENOTFOUND',
    'ECONNREFUSED',
    'ECONNRESET',
    'EAI_AGAIN',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'ETIMEDOUT',
];

// Native `fetch` (undici) reports connectivity failures as `TypeError: fetch failed` and attaches
// the underlying system error on the `cause` chain, so we walk it to find the error code.
const getNodeJSErrorCode = (e: unknown): string | undefined => {
    if (typeof e !== 'object' || e === null) {
        return undefined;
    }
    if ('code' in e && typeof e.code === 'string') {
        return e.code;
    }
    if ('cause' in e) {
        return getNodeJSErrorCode(e.cause);
    }

    return undefined;
};

const isNodeJSOfflineError = (e: Error) => {
    if (e instanceof TypeError && e.message.includes('fetch failed')) {
        return true;
    }

    const code = getNodeJSErrorCode(e);

    return code !== undefined && NODEJS_NETWORK_ERROR_CODES.includes(code);
};

const isReactNativeOfflineError = (e: Error) =>
    e.name === 'TypeError' && e.message.includes('Network request failed');

// Browser/Chromium `fetch` throws `TypeError: Failed to fetch` when the request never completes.
const isBrowserOfflineError = (e: Error) =>
    e instanceof TypeError && e.message.includes('Failed to fetch');

const isAbortControllerTimeout = (e: Error) =>
    e.message.includes('Aborted') ||
    e.name === 'AbortError' ||
    (e.name === 'TimeoutError' && e.message.includes('signal timed out'));

/**
 * Check if an error signifies a missing fetch response (meaning network connection loss or unavailable host).
 * Each runtime surfaces this differently: nodeJS/undici as `fetch failed` (with a system error code on
 * the `cause` chain), React native as `Network request failed`, and browser/Chromium as `Failed to fetch`.
 * Additionally, AbortController timeouts are also considered to be network issues.
 */
const isOfflineError = (e: unknown): boolean => {
    if (!(e instanceof Error)) return false;

    return (
        isNodeJSOfflineError(e) ||
        isReactNativeOfflineError(e) ||
        isBrowserOfflineError(e) ||
        isAbortControllerTimeout(e)
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
    deviceRevision?: string | null;
    expectedRevision: string | undefined;
    deviceBootloaderHash?: string | null;
    expectedBootloaderHash: string | undefined;
    firmwareType: FirmwareType;
};

type DoRevisionsMatchParams = {
    deviceRevision?: string | null;
    expectedCommitRevision: string;
    firmwareVersion: VersionArray;
};

const doRevisionsMatch = ({
    deviceRevision,
    expectedCommitRevision,
    firmwareVersion,
}: DoRevisionsMatchParams): boolean => {
    if (!deviceRevision) {
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
    deviceBootloaderHash,
    expectedBootloaderHash,
    firmwareType,
}: CheckFirmwareRevisionParams): Promise<FirmwareRevisionCheckResult> => {
    // DEBUG CODE
    const windowOrGlobal: any = typeof window !== 'undefined' ? window : global;
    const OVERRIDE = windowOrGlobal.revisionCheck;
    // prettier-ignore
    const arr = ['revision-mismatch', 'firmware-version-unknown', 'cannot-perform-check-offline', 'other-error'];
    if (arr.includes(OVERRIDE)) {
        return failFirmwareRevisionCheck(OVERRIDE);
    }

    // checking bootloader_hash is optional and only for T1B1, so check for failure first if available, or ignore and continue
    if (expectedBootloaderHash && deviceBootloaderHash !== expectedBootloaderHash) {
        return failFirmwareRevisionCheck('bootloader-hash-mismatch');
    }

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

            // again, check bootloader_hash in case it became available in the online release
            const expectedOnlineBootloaderHash = onlineRelease.bootloader_hash;
            if (
                expectedOnlineBootloaderHash &&
                deviceBootloaderHash !== expectedOnlineBootloaderHash
            ) {
                return failFirmwareRevisionCheck('bootloader-hash-mismatch');
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
