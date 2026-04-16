// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RequestLogin.js

import type { ConnectSettings } from '@trezor/connect-common';
import { RequestLoginSchema } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';

export default class RequestLogin extends AbstractMethod<'requestLogin', PROTO.SignIdentity> {
    constructor(message: MethodMessage<'requestLogin'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(RequestLoginSchema, payload);

        const identity: PROTO.IdentityType = {};
        const settings: ConnectSettings = DataManager.getSettings();

        const origin = payload.origin || settings.origin;

        if (origin) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [proto, host, port]: [string, string, string | undefined] = origin.split(':');
            identity.proto = proto;
            identity.host = host.substring(2);
            if (port) {
                identity.port = port;
            }
            identity.index = 0;
        }

        const params = {
            identity,
            challenge_hidden: payload.challengeHidden || '',
            challenge_visual: payload.challengeVisual || '',
        };

        super(message, params);
        this.useEmptyPassphrase = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
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
