import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { versionUtils } from '@trezor/utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetDelegatedIdentityKey extends AbstractMethod<
    'evoluGetDelegatedIdentityKey',
    PROTO.EvoluGetDelegatedIdentityKey
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'evoluGetDelegatedIdentityKey'>) {
        super(message);
        this.useDevice = true;
        this.useUi = true;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {}

    get info() {
        return 'Evolu get delegated identity key';
    }

    async run() {
        const thpState = this.getDevice().getThpState();
        const version = this.device.getVersion();
        if (thpState) {
            this.params = {
                thp_credential: thpState.pairingCredentials[0].credential,

                ...(version !== undefined && versionUtils.isNewer(version, [2, 10, 0])
                    ? {} // The `host_static_public_key` is no longer required
                    : {
                          host_static_public_key:
                              thpState.handshakeCredentials?.hostStaticPublicKey.toString('hex'),
                      }),
            };
        }

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'EvoluGetDelegatedIdentityKey',
            'EvoluDelegatedIdentityKey',
            this.params,
        );

        return response.message;
    }
}
