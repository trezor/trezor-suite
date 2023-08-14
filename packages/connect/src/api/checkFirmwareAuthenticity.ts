import randombytes from 'randombytes';
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

        const deviceVersion = `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;

        const releases = getReleases(device.features.major_version);

        const release = releases.find(release => release.version.join('.') === deviceVersion);

        // should never happen
        if (!release) {
            throw ERRORS.TypedError(
                'Runtime',
                'checkFirmwareAuthenticity: No release found for device firmware',
            );
        }

        const baseUrl = `https://data.trezor.io/firmware/${device.features.major_version}`;
        const fwUrl = `${baseUrl}/trezor-${deviceVersion}${
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
            randombytes(32),
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
