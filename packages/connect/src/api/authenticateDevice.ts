import {
    AuthenticateDeviceParams,
    type MethodPermission,
    UI_REQUEST,
} from '@trezor/connect-common';
import type { VerifyAuthenticityProofResult } from '@trezor/device-authenticity';
import {
    deviceAuthenticityBlacklistConfig,
    deviceAuthenticityConfig,
    getRandomChallenge,
    prepareDeviceAuthenticityData,
    validateSerialNumbers,
    verifyAuthenticityProof,
} from '@trezor/device-authenticity';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
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
            signedData: prepareDeviceAuthenticityData({ payload: challenge }),
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

        const hasTropicAbility =
            !this.getDevice().unavailableCapabilities['tropicDeviceAuthentication'];

        const getTropicResult = async (): Promise<VerifyAuthenticityProofResult | null> => {
            const { tropic_signature: signature, tropic_certificates: certificates } = message;
            const isAvailable = signature !== undefined && certificates.length > 0;
            const isRequired = hasTropicAbility;
            if (isAvailable) {
                return await verifyAuthenticityProof({ ...commonParams, certificates, signature });
            }

            return isRequired ? { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' } : null;
        };

        const getMCUResult = async (): Promise<VerifyAuthenticityProofResult | null> => {
            const { mcu_signature: signature, mcu_certificates: certificates } = message;
            const isAvailable = signature !== undefined && certificates.length > 0;
            const isRequired = !this.getDevice().unavailableCapabilities['mcuDeviceAuthentication'];
            if (isAvailable) {
                return await verifyAuthenticityProof({
                    ...commonParams,
                    certificates,
                    signature,
                });
            }

            return isRequired ? { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' } : null;
        };

        const [optigaResult, tropicResult, mcuResult] = await Promise.all([
            getOptigaResult(),
            getTropicResult(),
            getMCUResult(),
        ]);
        const results = { optigaResult, tropicResult, mcuResult };

        // Only T3W1 and later have serialNumber (i.e. devices that support Tropic authentication), this validation is skipped for all older models.
        return hasTropicAbility ? validateSerialNumbers(results) : results;
    }
}
