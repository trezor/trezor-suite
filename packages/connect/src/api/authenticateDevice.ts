import {
    VerifyAuthenticityProofResult,
    deviceAuthenticityBlacklistConfig,
    deviceAuthenticityConfig,
    getRandomChallenge,
    prepareDeviceAuthenticityData,
    verifyAuthenticityProof,
} from '@trezor/device-authenticity';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { AuthenticateDeviceParams } from '../types/api/authenticateDevice';

export default class AuthenticateDevice extends AbstractMethod<
    'authenticateDevice',
    AuthenticateDeviceParams
> {
    init() {
        this.useEmptyPassphrase = true;
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.skipFinalReload = false;
        this.useDeviceState = false;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;

        Assert(AuthenticateDeviceParams, payload);

        this.params = {
            config: payload.config,
            blacklistConfig: payload.blacklistConfig,
            allowDebugKeys: payload.allowDebugKeys,
        };
    }

    async run() {
        const challenge = getRandomChallenge();

        const { message } = await this.device
            .getCommands()
            .typedCall('AuthenticateDevice', 'AuthenticityProof', {
                challenge: challenge.toString('hex'),
            });

        const config = this.params.config || deviceAuthenticityConfig;
        const blacklistConfig = this.params.blacklistConfig || deviceAuthenticityBlacklistConfig;
        const commonParams = {
            data: prepareDeviceAuthenticityData({ payload: challenge }),
            deviceModel: this.device.features.internal_model,
            allowDebugKeys: this.params.allowDebugKeys,
            config,
            blacklistConfig,
        } as const;

        const getOptigaResult = async (): Promise<VerifyAuthenticityProofResult> => {
            const { optiga_signature: signature, optiga_certificates: certificates } = message;
            const isAvailable = signature !== undefined && certificates.length > 0;
            if (isAvailable) {
                return await verifyAuthenticityProof({ ...commonParams, certificates, signature });
            }

            // all devices capable of 'authenticateDevice' (see src/data/config.ts) have Optiga, so it's always required
            return { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' };
        };

        const getTropicResult = async (): Promise<VerifyAuthenticityProofResult | null> => {
            const { tropic_signature: signature, tropic_certificates: certificates } = message;
            const isAvailable = signature !== undefined && certificates.length > 0;
            const isRequired = !this.device.unavailableCapabilities['tropicDeviceAuthentication'];
            if (isAvailable) {
                return await verifyAuthenticityProof({ ...commonParams, certificates, signature });
            }
            if (isRequired) {
                return { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' };
            }

            return null;
        };
        const optigaResult = await getOptigaResult();
        const tropicResult = await getTropicResult();

        return { optigaResult, tropicResult };
    }
}
