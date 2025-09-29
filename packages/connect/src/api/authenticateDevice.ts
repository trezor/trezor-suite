import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { deviceAuthenticityBlacklist } from '../data/deviceAuthenticityBlacklist';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { deviceAuthenticityConfig } from '../data/deviceAuthenticityConfig';
import { verifyAuthenticityProof } from './firmware/verifyAuthenticityProof';
import { AuthenticateDeviceParams } from '../types/api/authenticateDevice';
import { getRandomChallenge } from './firmware/verifyAuthenticity/utils';

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
        const blacklistConfig = this.params.blacklistConfig || deviceAuthenticityBlacklist;
        const commonParams = {
            challenge,
            deviceModel: this.device.features.internal_model,
            allowDebugKeys: this.params.allowDebugKeys,
            config,
            blacklistConfig,
        } as const;

        // when this method is called, optiga is currently always expected to be there
        const optigaResult = await verifyAuthenticityProof({
            ...commonParams,
            certificates: message.optiga_certificates,
            signature: message.optiga_signature,
        });

        // Tropic check is still is optional = not enforced
        // TODO make it compulsory for T3W1 which is expected to have it https://github.com/trezor/trezor-suite/issues/22448
        const { tropic_signature } = message;
        const isTropicAvailable =
            tropic_signature !== undefined && message.tropic_certificates.length > 0;
        const tropicResult = isTropicAvailable
            ? await verifyAuthenticityProof({
                  ...commonParams,
                  certificates: message.tropic_certificates,
                  signature: tropic_signature,
              })
            : null;

        return { optigaResult, tropicResult };
    }
}
