import { randomBytes } from 'crypto';

import { isArrayMember, serializeError, versionUtils } from '@trezor/utils';

import { calculateFirmwareHash, getBinaryOptional, stripFwHeaders } from '../../api/firmware';
import { FIRMWARE } from '../../constants';
import { DataManager } from '../../data/DataManager';
import { getReleases } from '../../data/firmwareInfo';
import { FirmwareHashCheckError, FirmwareHashCheckResult, FirmwareType } from '../../types';
import { Log } from '../../utils/debug';
import type { Device } from '../Device';

const createFailResult = (error: FirmwareHashCheckError, errorPayload?: unknown) => ({
    success: false,
    error,
    errorPayload,
});

type Context = {
    device: Device;
    logger: Log;
};

const checkFirmwareHash = async ({
    device,
    logger,
}: Context): Promise<FirmwareHashCheckResult | null> => {
    const baseUrl = DataManager.getSettings('binFilesBaseUrl');
    const enabled = DataManager.getSettings('enableFirmwareHashCheck');
    const timeoutThresholdsPerModel = DataManager.getSettings('firmwareHashCheckTimeouts');
    if (!enabled || baseUrl === undefined) return createFailResult('check-skipped');
    const firmwareVersion = device.getVersion();
    // device has no features (not yet connected) or no firmware
    if (firmwareVersion === undefined || !device.features || device.features.bootloader_mode) {
        return null;
    }

    const checkSupported = !device.unavailableCapabilities.getFirmwareHash;
    if (!checkSupported) return createFailResult('check-unsupported');

    const release = getReleases(device.features.internal_model).find(r =>
        versionUtils.isEqual(r.version, firmwareVersion),
    );
    // if version is expected to support hash check, but the release is unknown, then firmware is considered unofficial
    if (release === undefined) return createFailResult('unknown-release');

    const btcOnly = device.firmwareType === FirmwareType.BitcoinOnly;
    const binary = await getBinaryOptional({ baseUrl, btcOnly, release });
    // release was found, but not its binary - happens on desktop, where only local files are searched
    if (binary === null) {
        return createFailResult('check-unsupported');
    }
    // binary was found, but it's likely a git LFS pointer (can happen on dev) - see onCallFirmwareUpdate.ts
    if (binary.byteLength < 200) {
        logger.warn(`Firmware binary for hash check suspiciously small (< 200 b)`);

        return createFailResult('check-unsupported');
    }

    const strippedBinary = stripFwHeaders(binary);
    const { hash: expectedHash, challenge } = calculateFirmwareHash(
        device.features.major_version,
        strippedBinary,
        randomBytes(32),
    );

    // handle rejection of call by a counterfeit device. If unhandled, it crashes device initialization,
    // so device can't be used, but it's preferable to display proper message about counterfeit device
    try {
        const ts = performance.now();
        const deviceResponse = await device
            .getCurrentSession()
            .typedCall('GetFirmwareHash', 'FirmwareHash', { challenge });
        if (!deviceResponse?.message?.hash) {
            return createFailResult('other-error', 'Device response is missing hash');
        }

        if (deviceResponse.message.hash !== expectedHash) {
            return createFailResult('hash-mismatch');
        }

        const duration = performance.now() - ts;
        logger.debug('GetFirmwareHash time', duration);
        const timeoutThreshold = timeoutThresholdsPerModel?.[device.features.internal_model];
        if (timeoutThreshold !== undefined && duration > timeoutThreshold) {
            return createFailResult('takes-too-long');
        }

        return { success: true };
    } catch (errorPayload) {
        return createFailResult('other-error', serializeError(errorPayload));
    }
};

const PROBE_CHECK_TIME_RETRIES = 4;

const probeCheckTime = async (context: Context) => {
    for (let i = 0; i < PROBE_CHECK_TIME_RETRIES; i++) {
        const result = await checkFirmwareHash(context);

        // The hash check itself on the device must take always the same time.
        // A delay can happen on the host side, so at least one good result means OK
        if (result !== null && (result.success || result.error !== 'takes-too-long')) {
            context.device.setAuthenticityChecks(result);

            return;
        }
    }
};

export const checkFirmwareHashWithRetries = async (context: Context): Promise<void> => {
    const lastResult = context.device.getAuthenticityChecks().firmwareHash;
    const notDoneYet = lastResult === null;
    const attemptsDone = lastResult?.attemptCount ?? 0;
    if (attemptsDone >= FIRMWARE.HASH_CHECK_MAX_ATTEMPTS) return;

    const wasError = lastResult !== null && !lastResult.success;
    const wasErrorRetriable =
        wasError && isArrayMember(lastResult.error, FIRMWARE.HASH_CHECK_RETRIABLE_ERRORS);
    const lastErrorPayload = wasError ? lastResult?.errorPayload : null;

    if (notDoneYet || wasErrorRetriable) {
        const result = await checkFirmwareHash(context);
        context.device.setAuthenticityChecks(result);

        if (result === null) return; // device was not acquired or was in bootloader mode, couldn't have performed the check
        result.attemptCount = attemptsDone + 1;

        if (!result.success && result.error === 'takes-too-long') {
            await probeCheckTime(context);
        }

        // if it succeeded only after a retry, and there was an `errorPayload` previously, we want to pass that information to suite
        if (result.success && lastErrorPayload) {
            result.warningPayload = { lastErrorPayload, successOnAttempt: result.attemptCount };
        }
    }
};
