import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetDelegatedIdentityKey extends AbstractMethod<
    'evoluGetDelegatedIdentityKey',
    PROTO.EvoluGetDelegatedIdentityKey
> {
    hasBundle?: boolean;

    constructor(message: { id?: number; payload: Payload<'evoluGetDelegatedIdentityKey'> }) {
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

    async run(device: Device) {
        const thpState = device.getThpState();
        if (thpState) {
            this.params = {
                thp_credential: thpState.pairingCredentials[0].credential,
                host_static_public_key:
                    thpState.handshakeCredentials?.hostStaticPublicKey.toString('hex'),
            };
        }

        const cmd = device.getCommands();
        const response = await cmd.typedCall(
            'EvoluGetDelegatedIdentityKey',
            'EvoluDelegatedIdentityKey',
            this.params,
        );

        return response.message;
    }
}
