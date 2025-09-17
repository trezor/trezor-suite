import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { deviceAuthenticityBlacklist } from '../data/deviceAuthenticityBlacklist';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { deviceAuthenticityConfig } from '../data/deviceAuthenticityConfig';
import { getRandomChallenge, verifyAuthenticityProof } from './firmware/verifyAuthenticityProof';
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
        const blacklistConfig = this.params.blacklistConfig || deviceAuthenticityBlacklist;
        const valid = await verifyAuthenticityProof({
            ...message,
            challenge,
            config,
            blacklistConfig,
            allowDebugKeys: this.params.allowDebugKeys,
            deviceModel: this.device.features.internal_model,
        });

        return valid;
    }
}
