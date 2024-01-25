// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/NEMSignTransaction.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../nemSignTx';
import type { PROTO } from '../../../constants';
import { Assert } from '@trezor/schema-utils';
import { NEMSignTransaction as NEMSignTransactionSchema } from '../../../types/api/nem';

export default class NEMSignTransaction extends AbstractMethod<
    'nemSignTransaction',
    PROTO.NEMSignTx
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, getMiscNetwork('NEM'), this.firmwareRange);

        const { payload } = this;
        // validate incoming parameters

        // Workaround for NEM timestamp case-sensitivity issue (issue #10793)
        if ((payload?.transaction as any)?.timestamp) {
            payload.transaction.timeStamp = (payload.transaction as any).timestamp;
        }
        Assert(NEMSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        // incoming data should be in nem-sdk format
        this.params = helper.createTx(payload.transaction, path, payload.chunkify);
    }

    get info() {
        return 'Sign NEM transaction';
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('NEMSignTx', 'NEMSignedTx', this.params);
        return response.message;
    }
}
