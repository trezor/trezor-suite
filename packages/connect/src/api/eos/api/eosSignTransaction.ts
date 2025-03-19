// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EosSignTransaction.js

import { AssertWeak } from '@trezor/schema-utils';

import type { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { EosSignTransaction as EosSignTransactionSchema } from '../../../types/api/eos';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import * as helper from '../eosSignTx';

type Params = {
    path: number[];
    chain_id: string;
    header: PROTO.EosTxHeader;
    ack: PROTO.EosTxActionAck[];
    chunkify: boolean;
};

export default class EosSignTransaction extends AbstractMethod<'eosSignTransaction', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_EOS'];
        this.firmwareRange = getFirmwareRange(this.name, getMiscNetwork('EOS'), this.firmwareRange);

        const { payload } = this;
        // validate incoming parameters
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(EosSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const { chain_id, header, ack } = helper.validate(payload.transaction);

        this.params = {
            path,
            chain_id,
            header,
            ack,
            chunkify: typeof payload.chunkify === 'boolean' ? payload.chunkify : false,
        };
    }

    get info() {
        return 'Sign EOS transaction';
    }

    async run() {
        const response = await helper.signTx(
            this.device.getCommands().typedCall,
            this.params.path,
            this.params.chain_id,
            this.params.header,
            this.params.ack,
            this.params.chunkify,
        );

        return {
            signature: response.signature,
        };
    }
}
