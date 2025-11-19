import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { thp } from '@trezor/protocol';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetDelegatedIdentityKey extends AbstractMethod<
    'evoluGetDelegatedIdentityKey',
    PROTO.EvoluGetDelegatedIdentityKey
> {
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;

        Assert(PROTO.EvoluGetDelegatedIdentityKey, payload);

        if (payload.thp !== undefined) {
            const staticKey = Buffer.from(payload.thp.staticHostKey, 'hex');
            const hostStaticKeys = thp.getCurve25519KeyPair(staticKey);
            this.params = {
                thp_credential: payload.thp.credential,
                host_static_public_key: hostStaticKeys.publicKey.toString('hex'),
            };
        } else {
            this.params = {};
        }
    }

    get info() {
        return 'Evolu get delegated identity key';
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall(
            'EvoluGetDelegatedIdentityKey',
            'EvoluDelegatedIdentityKey',
            this.params,
        );

        return response.message;
    }
}
