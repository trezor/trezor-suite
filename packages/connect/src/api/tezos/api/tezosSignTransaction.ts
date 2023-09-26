// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosSignTransaction.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../tezosSignTx';
import type { PROTO } from '../../../constants';

export default class TezosSignTransaction extends AbstractMethod<
    'tezosSignTransaction',
    PROTO.TezosSignTx
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Tezos'),
            this.firmwareRange,
        );

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'branch', type: 'string', required: true },
            { name: 'operation', required: true },
        ]);

        const path = validatePath(payload.path, 3);
        this.params = helper.createTx(path, payload.branch, payload.operation);
    }

    get info() {
        return 'Sign Tezos transaction';
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('TezosSignTx', 'TezosSignedTx', this.params);
        return response.message;
    }
}
