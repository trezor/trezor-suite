import { randomBytes } from '@noble/hashes/utils.js';

import type { FirmwareHashCheckError, FirmwareHashCheckResult } from '@trezor/connect-common';
import { type Logger, serializeError } from '@trezor/utils';

import { calculateFirmwareHash, getBinaryOptional, stripFwHeaders } from '../../api/firmware';
import { getFirmwareLocation, getReleaseByVersion } from '../../data/firmwareInfo';
import * as settingsStore from '../../data/settingsStore';
import type { IDevice } from '../../types/idevice';
import { getFirmwareType } from '../../utils/firmwareUtils';

const createFailResult = (error: FirmwareHashCheckError, errorPayload?: unknown) => ({
    success: false,
    error,
    errorPayload,
});

type Context = {
    device: IDevice;
    logger: Logger;
};

export const checkFirmwareHash = async ({
    device,
    logger,
}: Context): Promise<FirmwareHashCheckResult | null> => {
    const enabled = settingsStore.get('enableFirmwareHashCheck');
    if (!enabled) return createFailResult('check-skipped');

    const firmwareVersion = device.getVersion();

    if (firmwareVersion === undefined || !device.features || device.features.bootloader_mode) {
        return null;
    }

    const firmwareType = getFirmwareType(device.features);
    const release = await getReleaseByVersion(device.features, firmwareVersion, firmwareType);

    // if version is expected to support hash check, but the release is unknown, then firmware is considered unofficial
    if (!release) return createFailResult('unknown-release');

    const firmwareLocation = getFirmwareLocation({
        firmwareVersion,
        remotePath: release.url,
        deviceModel: device.features.internal_model,
        firmwareType: getFirmwareType(device.features),
    });
    const { baseUrl, path } = firmwareLocation;

    const timeoutThresholdsPerModel = settingsStore.get('firmwareHashCheckTimeouts');
    // device has no features (not yet connected) or no firmware
    if (firmwareVersion === undefined || !device.features || device.features.bootloader_mode) {
        return null;
    }

    const checkSupported = !device.unavailableCapabilities.getFirmwareHash;
    if (!checkSupported) return createFailResult('check-unsupported');

    const firmwareBinary = await getBinaryOptional({
        baseUrl,
        path,
        release,
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
    const { hash: expectedHash, challenge } = calculateFirmwareHash({
        internal_model: device.features.internal_model,
        firmwareVersion,
        fw: Buffer.from(strippedBinary),
        key: Buffer.from(randomBytes(32)),
    });

    // handle rejection of call by a counterfeit device. If unhandled, it crashes device initialization,
    // so device can't be used, but it's preferable to display proper message about counterfeit device
    try {
        // DEBUG CODE
        const windowOrGlobal: any = typeof window !== 'undefined' ? window : global;
        const OVERRIDE = windowOrGlobal.hashCheck;
        if (OVERRIDE === 'other-error') throw 'this is SIMULATED ERROR';

        const ts = performance.now();
        const deviceResponse = await device
            .getCurrentSession()
            .typedCall('GetFirmwareHash', 'FirmwareHash', { challenge });
        if (!deviceResponse?.message?.hash) {
            return createFailResult('other-error', 'Device response is missing hash');
        }

        // DEBUG CODE - replacing original condition completely, so you can test with user env or real device interchangeably
        console.log('expected hash: ' + expectedHash);
        console.log('recieved hash: ' + deviceResponse.message.hash);
        if (OVERRIDE === 'hash-mismatch') return createFailResult('hash-mismatch');
        if (OVERRIDE === 'takes-too-long') return createFailResult('takes-too-long');

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
