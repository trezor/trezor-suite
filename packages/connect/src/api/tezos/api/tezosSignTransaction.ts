// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosSignTransaction.js

import { AssertWeak } from '@trezor/schema-utils';

import type { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { TezosSignTransaction as TezosSignTransactionSchema } from '../../../types/api/tezos';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import * as helper from '../tezosSignTx';

export default class TezosSignTransaction extends AbstractMethod<
    'tezosSignTransaction',
    PROTO.TezosSignTx
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Tezos'),
            this.firmwareRange,
        );

        const { payload } = this;

        // validate incoming parameters
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(TezosSignTransactionSchema, payload);

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
