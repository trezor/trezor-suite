// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RippleSignTransaction.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { RippleSignTransaction as RippleSignTransactionSchema } from '../../../types/api/ripple';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

export default class RippleSignTransaction extends AbstractMethod<
    'rippleSignTransaction',
    PROTO.RippleSignTx
> {
    constructor(message: MethodMessage<'rippleSignTransaction'>, context: MethodContext) {
        super(message, context);
        this.requiredDeviceCapabilities = ['Capability_Ripple'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Ripple'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;
        // validate incoming parameters
        Assert(RippleSignTransactionSchema, payload);

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
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall('RippleSignTx', 'RippleSignedTx', this.params);

        return {
            serializedTx: message.serialized_tx,
            signature: message.signature,
        };
    }
}
