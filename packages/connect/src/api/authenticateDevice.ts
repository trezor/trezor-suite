import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { deviceAuthenticityConfig } from '../data/deviceAuthenticityConfig';
import { AuthenticateDeviceParams } from '../types/api/authenticateDevice';
import { getRandomChallenge, verifyAuthenticityProof } from './firmware/verifyAuthenticityProof';

export default class AuthenticateDevice extends AbstractMethod<
    'authenticateDevice',
    AuthenticateDeviceParams
> {
    init() {
        this.useEmptyPassphrase = true;
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        this.setFirmwareRange(this.name, null);

        const { payload } = this;

        Assert(AuthenticateDeviceParams, payload);

        this.params = {
            config: payload.config,
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
        const valid = await verifyAuthenticityProof({
            ...message,
            challenge,
            config,
            allowDebugKeys: this.params.allowDebugKeys,
            deviceModel: this.device.features.internal_model,
        });

        return valid;
    }
}
