// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosSignTransaction.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission, Payload } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { TezosSignTransaction as TezosSignTransactionSchema } from '../../../types/api/tezos';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import * as helper from '../tezosSignTx';

export default class TezosSignTransaction extends AbstractMethod<
    'tezosSignTransaction',
    PROTO.TezosSignTx
> {
    constructor(message: { id?: number; payload: Payload<'tezosSignTransaction'> }) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Tezos'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        Assert(TezosSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        this.params = helper.createTx(path, payload.branch, payload.operation);
    }

    get info() {
        return 'Sign Tezos transaction';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('TezosSignTx', 'TezosSignedTx', this.params);

        return response.message;
    }
}
