// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosSignTransaction.js

import { TezosSignTransaction as TezosSignTransactionSchema } from '@trezor/connect-common/src/types/api/tezos';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../tezosSignTx';

export default class TezosSignTransaction extends AbstractMethod<
    'tezosSignTransaction',
    PROTO.TezosSignTx
> {
    constructor(message: MethodMessage<'tezosSignTransaction'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(TezosSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const params = helper.createTx(path, payload.branch, payload.operation);

        super(message, params);
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.requiredFirmwareCoins = [getMiscNetwork('Tezos')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
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
