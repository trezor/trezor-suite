import { randomBytes } from 'crypto';
import { AbstractMethod } from '../core/AbstractMethod';
import { stripFwHeaders, calculateFirmwareHash, getBinary } from './firmware';
import { getReleases } from '../data/firmwareInfo';
import { ERRORS } from '../constants';
import { FirmwareType } from '../types';
import { validateParams } from './common/paramsValidator';
import { CheckFirmwareAuthenticityParams } from '../types/api/checkFirmwareAuthenticity';

export default class CheckFirmwareAuthenticity extends AbstractMethod<
    'checkFirmwareAuthenticity',
    CheckFirmwareAuthenticityParams
> {
    init() {
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;
        validateParams(payload, [{ name: 'baseUrl', type: 'string' }]);
        this.params = { baseUrl: payload.baseUrl };
    }

    async run() {
        const { device } = this;

        if (!device.firmwareRelease) {
            throw ERRORS.TypedError('Runtime', 'device.firmwareRelease is not set');
        }

        const btcOnly = device.firmwareType === FirmwareType.BitcoinOnly;

        try {
            const fw = await getBinary({
                releases: getReleases(device.features?.internal_model),
                baseUrl: this.params.baseUrl ?? 'https://data.trezor.io',
                version: device.getVersion(),
                btcOnly,
            });

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
        } catch (e) {
            throw ERRORS.TypedError('Runtime', `${e}`);
        }
    }
}
