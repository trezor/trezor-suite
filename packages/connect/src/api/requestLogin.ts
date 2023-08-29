// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RequestLogin.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { DataManager } from '../data/DataManager';
import type { ConnectSettings } from '../types';
import type { PROTO } from '../constants';

export default class RequestLogin extends AbstractMethod<'requestLogin', PROTO.SignIdentity> {
    asyncChallenge?: boolean;

    async init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.useEmptyPassphrase = true;

        const { payload } = this;

        const identity: PROTO.IdentityType = {};
        const settings: ConnectSettings = DataManager.getSettings();
        if (settings.origin) {
            const [proto, host, port] = settings.origin.split(':');
            identity.proto = proto;
            identity.host = host.substring(2);
            if (port) {
                identity.port = port;
            }
            identity.index = 0;
        }

        // validate incoming parameters
        validateParams(payload, [
            { name: 'challengeHidden', type: 'string' },
            { name: 'challengeVisual', type: 'string' },
            { name: 'asyncChallenge', type: 'boolean' },
        ]);

        this.params = {
            identity,
            challenge_hidden: payload.challengeHidden || '',
            challenge_visual: payload.challengeVisual || '',
        };
        this.asyncChallenge = !!payload.asyncChallenge;
    }

    get info() {
        return 'Login';
    }

    async run() {
        if (this.asyncChallenge) {
            // create ui promise
            const uiPromise = this.createUiPromise(UI.LOGIN_CHALLENGE_RESPONSE);
            // send request to developer
            this.postMessage(createUiMessage(UI.LOGIN_CHALLENGE_REQUEST));
            // wait for response from developer
            const { payload } = await uiPromise.promise;

            // error handler
            if (typeof payload === 'string') {
                throw ERRORS.TypedError(
                    'Runtime',
                    `TrezorConnect.requestLogin callback error: ${payload}`,
                );
            }

            // validate incoming parameters
            validateParams(payload, [
                { name: 'challengeHidden', type: 'string', required: true },
                { name: 'challengeVisual', type: 'string', required: true },
            ]);

            this.params.challenge_hidden = payload.challengeHidden;
            this.params.challenge_visual = payload.challengeVisual;
        }
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SignIdentity', 'SignedIdentity', this.params);
        return {
            address: message.address,
            publicKey: message.public_key,
            signature: message.signature,
        };
    }
}
