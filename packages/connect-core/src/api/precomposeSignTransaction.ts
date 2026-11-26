import {
    type BitcoinNetworkInfo,
    type PROTO,
    type RefTransaction,
    getOriginalTxids,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { getRefTransactions, validateTrezorInputs, validateTrezorOutputs } from './bitcoin';
import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
import { getTransactionVbytes } from './bitcoin/transactionBytes';
import { validateParams } from './common/paramsValidator';

type Params = {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    refTxs?: RefTransaction[];
    coinInfo: BitcoinNetworkInfo;
};

export default class PrecomposeSignTransaction extends AbstractMethod<
    'precomposeSignTransaction',
    Params
> {
    constructor(message: MethodMessage<'precomposeSignTransaction'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'inputs', type: 'array', required: true },
            { name: 'outputs', type: 'array', required: true },
            { name: 'refTxs', type: 'array', allowEmpty: true },
            { name: 'account', type: 'object' },
        ]);

        const coinInfo = getBitcoinNetworkOrThrow(payload.coin);
        const inputs = validateTrezorInputs(payload.inputs, coinInfo);
        const outputs = validateTrezorOutputs(payload.outputs, coinInfo);
        const refTxs = getRefTransactions({
            refTxs: payload.refTxs,
            account: payload.account,
            inputs,
            origTxids: getOriginalTxids(inputs, outputs),
            coinInfo,
        });

        super(message, { inputs, outputs, refTxs, coinInfo });
        this.useDevice = false;
    }

    get requiredPermissions() {
        return [];
    }

    run() {
        const { inputs, outputs, coinInfo, refTxs } = this.params;
        const inputsTotal: BigNumber = inputs.reduce((bn, input) => {
            if (typeof input.amount === 'string') {
                return bn.plus(input.amount);
            } else {
                if (!refTxs) {
                    throw ERRORS.TypedError(
                        'Runtime',
                        'refTxs are required for precomposed transaction info when input amount is not provided',
                    );
                }
                const refTx = refTxs.find(tx => tx.hash === input.prev_hash);
                const refOutput =
                    refTx?.outputs?.[input.prev_index] ?? refTx?.bin_outputs?.[input.prev_index];
                if (refOutput) return bn.plus(refOutput.amount);
            }

            return bn;
        }, new BigNumber(0));
        const outputsTotal: BigNumber = outputs.reduce(
            (bn, output) => bn.plus(typeof output.amount === 'string' ? output.amount : '0'),
            new BigNumber(0),
        );
        const bytes = getTransactionVbytes(inputs, outputs, coinInfo);
        if (!bytes) throw ERRORS.TypedError('Runtime', 'Transaction bytes not calculated');
        const fee = inputsTotal.minus(outputsTotal);
        if (fee.lte(0)) {
            throw ERRORS.TypedError('Runtime', 'Computed fee is non-positive');
        }
        const feePerByte = fee.dividedBy(bytes);

        const result = {
            type: 'final' as const,
            inputs,
            outputs,
            outputsPermutation: Array.from({ length: outputs.length }, (_, i) => i),
            totalSpent: inputsTotal.toString(),
            fee: fee.toString(),
            feePerByte: feePerByte.toString(),
            bytes,
        };

        return Promise.resolve(result);
    }
}
