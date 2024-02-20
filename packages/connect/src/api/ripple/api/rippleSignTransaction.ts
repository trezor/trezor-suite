// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RippleSignTransaction.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import type { PROTO } from '../../../constants';
import { AssertWeak } from '@trezor/schema-utils';
import { RippleSignTransaction as RippleSignTransactionSchema } from '../../../types/api/ripple';

export default class RippleSignTransaction extends AbstractMethod<
    'rippleSignTransaction',
    PROTO.RippleSignTx
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Ripple'),
            this.firmwareRange,
        );

        const { payload } = this;
        // validate incoming parameters
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(RippleSignTransactionSchema, payload);

        const path = validatePath(payload.path, 5);
        // incoming data should be in ripple-sdk format
        const { transaction, chunkify } = payload;
        this.params = {
            address_n: path,
            fee: transaction.fee,
            flags: transaction.flags,
            sequence: transaction.sequence,
            last_ledger_sequence: transaction.maxLedgerVersion,
            payment: {
                amount: transaction.payment.amount,
                destination: transaction.payment.destination,
                destination_tag: transaction.payment.destinationTag,
            },
            chunkify: typeof chunkify === 'boolean' ? chunkify : false,
        };
    }

    get info() {
        return 'Sign Ripple transaction';
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('RippleSignTx', 'RippleSignedTx', this.params);

        return {
            serializedTx: message.serialized_tx,
            signature: message.signature,
        };
    }
}
