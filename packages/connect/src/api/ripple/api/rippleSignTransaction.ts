// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RippleSignTransaction.js

import {
    type MethodPermission,
    RippleSignTransaction as RippleSignTransactionSchema,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    PAYMENT_REQUEST_AMOUNT_BYTES,
    encodePaymentRequestAmount,
} from '../../../utils/paymentRequest';

export default class RippleSignTransaction extends AbstractMethod<
    'rippleSignTransaction',
    PROTO.RippleSignTx
> {
    constructor(message: MethodMessage<'rippleSignTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        Assert(RippleSignTransactionSchema, payload);

        const path = validatePath(payload.path, 5);
        // incoming data should be in ripple-sdk format
        const { transaction, chunkify } = payload;
        const params = {
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
            payment_req: payload.payment_req
                ? encodePaymentRequestAmount(
                      payload.payment_req,
                      PAYMENT_REQUEST_AMOUNT_BYTES.DEFAULT,
                  )
                : undefined,
            chunkify: typeof chunkify === 'boolean' ? chunkify : false,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Ripple'];
        this.requiredFirmwareCoins = [getMiscNetwork('Ripple')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
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
