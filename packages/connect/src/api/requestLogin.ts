// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RequestLogin.js

import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { DataManager } from '../data/DataManager';
import type { ConnectSettings } from '../types';
import { RequestLoginSchema } from '../types/api/requestLogin';

export default class RequestLogin extends AbstractMethod<'requestLogin', PROTO.SignIdentity> {
    constructor(message: MethodMessage<'requestLogin'>) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.useEmptyPassphrase = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        Assert(RequestLoginSchema, payload);

        const identity: PROTO.IdentityType = {};
        const settings: ConnectSettings = DataManager.getSettings();

        const origin = payload.origin || settings.origin;

        if (origin) {
            const [proto, host, port] = origin.split(':');
            identity.proto = proto;
            identity.host = host.substring(2);
            if (port) {
                identity.port = port;
            }
            identity.index = 0;
        }

        this.params = {
            identity,
            challenge_hidden: payload.challengeHidden || '',
            challenge_visual: payload.challengeVisual || '',
        };
    }

    get info() {
        return 'Login';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall('SignIdentity', 'SignedIdentity', this.params);

        return {
            address: message.address,
            publicKey: message.public_key,
            signature: message.signature,
        };
    }
}
