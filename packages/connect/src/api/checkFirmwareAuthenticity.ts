import { randomBytes } from 'crypto';
import { AbstractMethod } from '../core/AbstractMethod';
import { stripFwHeaders, calculateFirmwareHash } from './firmware';
import { getReleases } from '../data/firmwareInfo';
import { ERRORS } from '../constants';
import { httpRequest } from '../utils/assets';
import { FirmwareType } from '../types';

export default class CheckFirmwareAuthenticity extends AbstractMethod<'checkFirmwareAuthenticity'> {
    init() {
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
    }

    async run() {
        const { device } = this;

        const firmwareVersion = `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;

        const releases = getReleases(device.features?.internal_model);

        const release = releases.find(release => release.version.join('.') === firmwareVersion);

        // should never happen
        if (!release) {
            throw ERRORS.TypedError(
                'Runtime',
                'checkFirmwareAuthenticity: No release found for device firmware',
            );
        }

        const deviceModelPath = `${device.features.internal_model}`.toLowerCase();

        const baseUrl = `https://data.trezor.io/firmware/${deviceModelPath}`;
        const fwUrl = `${baseUrl}/trezor-${deviceModelPath}-${firmwareVersion}${
            device.firmwareType === FirmwareType.BitcoinOnly ? '-bitcoinonly.bin' : '.bin'
        }`;

        const fw = await httpRequest(fwUrl, 'binary');

        if (!fw) {
            throw ERRORS.TypedError(
                'Runtime',
                'checkFirmwareAuthenticity: firmware binary not found',
            );
        }

        const { hash: expectedFirmwareHash, challenge } = calculateFirmwareHash(
            device.features.major_version,
            stripFwHeaders(fw),
            randomBytes(32),
        );

        const result = await this.device
            .getCommands()
            .typedCall('GetFirmwareHash', 'FirmwareHash', {
                challenge,
            });

        const { message } = result;
        const { hash: actualFirmwareHash } = message;

        return {
            expectedFirmwareHash,
            actualFirmwareHash,
            valid: actualFirmwareHash === expectedFirmwareHash,
        };
    }
}
