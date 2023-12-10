import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
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
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;

        validateParams(payload, [
            { name: 'config', type: 'object' },
            { name: 'allowDebugKeys', type: 'boolean' },
        ]);
        if (payload.config) {
            validateParams(payload.config, [{ name: 'timestamp', type: 'string', required: true }]);
            validateParams(payload.config.T2B1, [
                { name: 'rootPubKeys', type: 'array', required: true },
                { name: 'caPubKeys', type: 'array', required: true },
            ]);
        }

        this.params = {
            config: payload.config,
            allowDebugKeys: payload.allowDebugKeys,
        };
    }

    async run() {
        try {
            console.log('AuthenticateDevice.run()', this.params);
            const challenge = getRandomChallenge();
            console.log('challenge', challenge);

            const { message } = await this.device
                .getCommands()
                .typedCall('AuthenticateDevice', 'AuthenticityProof', {
                    challenge: challenge.toString('hex'),
                });

            console.log('message', message);

            const config = this.params.config || deviceAuthenticityConfig;
            const valid = await verifyAuthenticityProof({
                ...message,
                challenge,
                config,
                allowDebugKeys: this.params.allowDebugKeys,
                deviceModel: this.device.features.internal_model,
            });

            console.log('valid', valid);

            return valid;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}
