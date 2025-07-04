import { randomBytes } from 'crypto';

import { serializeError, versionUtils } from '@trezor/utils';

import { calculateFirmwareHash, getBinaryOptional, stripFwHeaders } from '../../api/firmware';
import { DataManager } from '../../data/DataManager';
import { getFirmwareLocation, getReleases } from '../../data/firmwareInfo';
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

export const checkFirmwareHash = async ({
    device,
    logger,
}: Context): Promise<FirmwareHashCheckResult | null> => {
    const enabled = DataManager.getSettings('enableFirmwareHashCheck');
    if (!enabled) return createFailResult('check-skipped');

    const firmwareVersion = device.getVersion();

    if (firmwareVersion === undefined || !device.features || device.features.bootloader_mode) {
        return null;
    }

    const firmwareLocation = getFirmwareLocation({
        firmwareVersion,
        internalModel: device.features.internal_model,
        firmwareType: device.firmwareType ? device.firmwareType : FirmwareType.Universal,
    });
    const { baseUrl, firmwareName } = firmwareLocation;

    const timeoutThresholdsPerModel = DataManager.getSettings('firmwareHashCheckTimeouts');
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

    const firmwareBinary = await getBinaryOptional({
        baseUrl,
        firmwareName,
        version: firmwareVersion,
    });

    // release was found, but not its binary - happens on desktop, where only local files are searched
    if (firmwareBinary === null) {
        return createFailResult('check-unsupported');
    }
    // binary was found, but it's likely a git LFS pointer (can happen on dev) - see onCallFirmwareUpdate.ts
    if (firmwareBinary.binary.byteLength < 200) {
        logger.warn(`Firmware binary for hash check suspiciously small (< 200 b)`);

        return createFailResult('check-unsupported');
    }

    const strippedBinary = stripFwHeaders(firmwareBinary.binary);
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
