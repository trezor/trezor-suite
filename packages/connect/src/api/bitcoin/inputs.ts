// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/inputs.js

import type { ComposedTxInput } from '@trezor/utxo-lib';
import type { TypedRawTransaction } from '@trezor/blockchain-link';
import { reverseBuffer } from '../../utils/bufferUtils';
import { validatePath, isSegwitPath, getScriptType, fixPath } from '../../utils/pathUtils';
import { convertMultisigPubKey } from '../../utils/hdnodeUtils';
import { validateParams } from '../common/paramsValidator';
import type { BitcoinNetworkInfo } from '../../types';
import type { PROTO } from '../../constants';

/** *****
 * SignTx: validation
 ****** */
export const validateTrezorInputs = (
    inputs: PROTO.TxInputType[],
    coinInfo: BitcoinNetworkInfo,
): PROTO.TxInputType[] =>
    inputs
        .map(i => fixPath(i))
        .map(i => convertMultisigPubKey(coinInfo.network, i))
        .map(input => {
            const useAmount = input.script_type === 'EXTERNAL' || isSegwitPath(input.address_n);
            // since 2.3.5 amount is required for all inputs.
            // this change however is breaking 3rd party implementations
            // missing amount will be delivered by refTx object
            validateParams(input, [
                { name: 'prev_hash', type: 'string', required: true },
                { name: 'prev_index', type: 'number', required: true },
                { name: 'amount', type: 'uint', required: useAmount },
                { name: 'script_type', type: 'string' },
                { name: 'sequence', type: 'number' },
                { name: 'multisig', type: 'object' },
            ]);

            if (input.script_type === 'EXTERNAL') {
                validateParams(input, [
                    { name: 'script_pubkey', type: 'string', required: true },
                    { name: 'commitment_data', type: 'string' },
                    { name: 'ownership_proof', type: 'string' },
                    { name: 'script_sig', type: 'string' },
                    { name: 'witness', type: 'string' },
                ]);
            } else {
                validatePath(input.address_n);
            }
            return input;
        });

// this method exist as a workaround for breaking change described in validateTrezorInputs
// TODO: it could be removed after another major version release.
export const enhanceTrezorInputs = (inputs: PROTO.TxInputType[], rawTxs: TypedRawTransaction[]) => {
    inputs.forEach(input => {
        if (!input.amount) {
            // eslint-disable-next-line no-console
            console.warn('TrezorConnect.singTransaction deprecation: missing input amount.');
            const refTx = rawTxs.find(t => 'txid' in t.tx && t.tx.txid === input.prev_hash);
            if (refTx && refTx.type === 'blockbook' && refTx.tx.vout[input.prev_index]) {
                input.amount = refTx.tx.vout[input.prev_index].value!;
            }
        }
    });
};

/** *****
 * Transform from @trezor/utxo-lib/compose format to Trezor
 ****** */
export const inputToTrezor = (input: ComposedTxInput, sequence: number): PROTO.TxInputType => {
    const address_n = input.path;
    return {
        address_n,
        prev_index: input.index,
        prev_hash: reverseBuffer(input.hash).toString('hex'),
        script_type: getScriptType(address_n),
        amount: input.amount,
        sequence,
    };
};
