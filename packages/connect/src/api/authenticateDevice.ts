import { AuthenticateDeviceParams, UI_REQUEST } from '@trezor/connect-common';
import type { VerifyAuthenticityProofResult } from '@trezor/device-authenticity';
import {
    deviceAuthenticityBlacklistConfig,
    deviceAuthenticityConfig,
    getRandomChallenge,
    prepareDeviceAuthenticityData,
    verifyAuthenticityProof,
} from '@trezor/device-authenticity';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthenticateDevice extends AbstractMethod<
    'authenticateDevice',
    AuthenticateDeviceParams
> {
    constructor(message: MethodMessage<'authenticateDevice'>) {
        const { payload } = message;

        Assert(AuthenticateDeviceParams, payload);

        const params = {
            config: payload.config,
            blacklistConfig: payload.blacklistConfig,
            allowDebugKeys: payload.allowDebugKeys,
        };

        super(message, params);
        this.useEmptyPassphrase = true;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const challenge = getRandomChallenge();

        const { message } = await this.getDevice()
            .getCommands()
            .typedCall('AuthenticateDevice', 'AuthenticityProof', {
                challenge: challenge.toString('hex'),
            });

        const config = this.params.config || deviceAuthenticityConfig;
        const blacklistConfig = this.params.blacklistConfig || deviceAuthenticityBlacklistConfig;
        const commonParams = {
            data: prepareDeviceAuthenticityData({ payload: challenge }),
            deviceModel: this.getDevice().features.internal_model,
            allowDebugKeys: this.params.allowDebugKeys,
            config,
            blacklistConfig,
        };

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
            const isRequired =
                !this.getDevice().unavailableCapabilities['tropicDeviceAuthentication'];
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
