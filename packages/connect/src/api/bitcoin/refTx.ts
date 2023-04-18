// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/refTx.js

import {
    payments as BitcoinJsPayments,
    Transaction as BitcoinJsTransaction,
} from '@trezor/utxo-lib';
import { bufferUtils } from '@trezor/utils';
import { getHDPath, getScriptType, getOutputScriptType } from '../../utils/pathUtils';
import { validateParams } from '../common/paramsValidator';
import { TypedError } from '../../constants/errors';
import type { TypedRawTransaction } from '@trezor/blockchain-link';
import type {
    TxInput as BitcoinJsInput,
    TxOutput as BitcoinJsOutput,
} from '@trezor/utxo-lib/lib/transaction/base';
import type { CoinInfo, AccountAddresses, AccountTransaction } from '../../types';
import type { RefTransaction, TransactionOptions } from '../../types/api/bitcoin';
import type { PROTO } from '../../constants';

// Referenced transactions are not required if:
// - all internal inputs script_type === SPENDTAPROOT
// - zcash tx version is NU5 (or greater)
export const requireReferencedTransactions = (
    inputs: PROTO.TxInputType[],
    options: TransactionOptions = {},
    coinInfo?: CoinInfo,
) => {
    if (coinInfo?.shortcut === 'ZEC' || coinInfo?.shortcut === 'TAZ') {
        return !(options.version && options.version >= 5);
    }
    const inputTypes = ['SPENDTAPROOT', 'EXTERNAL'];
    return !!inputs.find(input => !inputTypes.find(t => t === input.script_type));
};

// Get array of unique referenced transactions ids
export const getReferencedTransactions = (inputs: PROTO.TxInputType[]) => {
    const result: string[] = [];
    inputs.forEach(input => {
        if (input.prev_hash && !result.includes(input.prev_hash)) {
            result.push(input.prev_hash);
        }
    });
    return result;
};

// Get array of unique original transactions ids (used in rbf)
export const getOrigTransactions = (inputs: PROTO.TxInputType[], outputs: PROTO.TxOutputType[]) => {
    const result: string[] = [];
    inputs.forEach(input => {
        if (input.orig_hash && !result.includes(input.orig_hash)) {
            result.push(input.orig_hash);
        }
    });
    outputs.forEach(output => {
        if (output.orig_hash && !result.includes(output.orig_hash)) {
            result.push(output.orig_hash);
        }
    });
    return result;
};

// extend refTx object with optional data
const enhanceTransaction = (refTx: RefTransaction, srcTx: BitcoinJsTransaction) => {
    const extraData = srcTx.getExtraData();
    if (extraData) {
        refTx.extra_data = extraData.toString('hex');
    }
    const specific = srcTx.getSpecificData();
    if (specific) {
        if (specific.type === 'zcash' && specific.versionGroupId && refTx.version >= 3) {
            refTx.version_group_id = specific.versionGroupId;
        }
        if (specific.type === 'dash' && srcTx.type && srcTx.version >= 3) {
            refTx.version |= srcTx.type << 16;
        }
    }
    return refTx;
};

// Transform orig transactions from Blockbook (blockchain-link) to Trezor format
const transformOrigTransaction = (
    origTx: Pick<AccountTransaction['details'], 'vin' | 'vout'> & {
        txid: string;
    },
    tx: BitcoinJsTransaction,
    addresses: AccountAddresses,
) => {
    const { vin, vout, txid } = origTx;
    const inputAddresses = addresses.used.concat(addresses.change).concat(addresses.unused);

    // inputs, required by TXORIGINPUT (TxAckInput) request from Trezor
    const inputsMap = (input: BitcoinJsInput, i: number) => {
        const rawInput = vin[i];
        if (!rawInput?.value || !rawInput?.addresses || rawInput.addresses.length !== 1) {
            throw TypedError(
                'Method_InvalidParameter',
                `transformOrigTransactions: invalid input at ${txid} [${i}]`,
            );
        }
        const [address] = rawInput.addresses;
        const inputAddress = inputAddresses.find(addr => addr.address === address);
        const address_n = getHDPath(inputAddress?.path || ''); // throw error on invalid path

        return {
            address_n,
            prev_hash: bufferUtils.reverseBuffer(input.hash).toString('hex'),
            prev_index: input.index,
            script_sig: input.script.toString('hex'),
            sequence: input.sequence,
            script_type: getScriptType(address_n),
            multisig: undefined, // TODO
            amount: rawInput.value,
            decred_tree: undefined, // TODO
            witness: tx.getWitness(i)?.toString('hex'),
            ownership_proof: undefined, // TODO
            commitment_data: undefined, // TODO
        };
    };

    // outputs, required by TXORIGOUTPUT (TxAckOutput) request from Trezor
    const outputsMap = (
        output: BitcoinJsOutput,
        i: number,
    ): Required<RefTransaction>['outputs'][number] => {
        const rawOutput = vout[i];
        if (!rawOutput.isAddress) {
            const { data } = BitcoinJsPayments.embed({ output: output.script });
            const op_return_data = data?.shift()?.toString('hex'); // shift OP code
            if (typeof op_return_data !== 'string') {
                throw TypedError(
                    'Method_InvalidParameter',
                    `transformOrigTransactions: invalid op_return_data at ${txid} [${i}]`,
                );
            }
            return {
                script_type: 'PAYTOOPRETURN',
                amount: '0',
                op_return_data,
            };
        }
        if (!rawOutput.addresses || rawOutput.addresses.length !== 1) {
            throw TypedError(
                'Method_InvalidParameter',
                `transformOrigTransactions: invalid output at ${txid} [${i}]`,
            );
        }
        const [address] = rawOutput.addresses;
        const changeAddress = addresses.change.find(addr => addr.address === address);
        const address_n = changeAddress && getHDPath(changeAddress.path);
        const amount = output.value.toString();
        return address_n
            ? {
                  address_n,
                  amount,
                  script_type: getOutputScriptType(address_n),
              }
            : {
                  address,
                  amount,
                  script_type: 'PAYTOADDRESS',
              };
    };

    const refTx: RefTransaction = {
        version: tx.version,
        hash: tx.getId(),
        inputs: tx.ins.map(inputsMap),
        outputs: tx.outs.map(outputsMap),
        lock_time: tx.locktime,
        timestamp: tx.timestamp,
        expiry: tx.expiry,
    };

    return enhanceTransaction(refTx, tx);
};

const isTransactionWithHex = (
    tx: TypedRawTransaction,
): tx is Extract<TypedRawTransaction, { type: 'blockbook' }> & { tx: { hex: string } } =>
    tx.type === 'blockbook' && !!tx.tx.hex;

export const transformOrigTransactions = (
    txs: TypedRawTransaction[],
    coinInfo: CoinInfo,
    addresses?: AccountAddresses,
): RefTransaction[] =>
    coinInfo.type !== 'bitcoin' || !addresses
        ? []
        : txs.filter(isTransactionWithHex).map(raw => {
              const tx = BitcoinJsTransaction.fromHex(raw.tx.hex, { network: coinInfo.network });
              return transformOrigTransaction(raw.tx, tx, addresses);
          });

// Transform referenced transactions from Blockbook (blockchain-link) to Trezor format
export const transformReferencedTransaction = (tx: BitcoinJsTransaction): RefTransaction => {
    // inputs, required by TXINPUT (TxAckPrevInput) request from Trezor
    const inputsMap = (input: BitcoinJsInput) => ({
        prev_index: input.index,
        sequence: input.sequence,
        prev_hash: bufferUtils.reverseBuffer(input.hash).toString('hex'),
        script_sig: input.script.toString('hex'),
    });

    // map bin_outputs, required by TXOUTPUT (TxAckPrevOutput) request from Trezor
    const binOutputsMap = (output: BitcoinJsOutput) => ({
        amount: output.value.toString(),
        script_pubkey: output.script.toString('hex'),
    });

    const refTx: RefTransaction = {
        version: tx.version,
        hash: tx.getId(),
        inputs: tx.ins.map(inputsMap),
        bin_outputs: tx.outs.map(binOutputsMap),
        lock_time: tx.locktime,
        timestamp: tx.timestamp,
        expiry: tx.expiry,
    };

    return enhanceTransaction(refTx, tx);
};

export const transformReferencedTransactions = (
    txs: TypedRawTransaction[],
    coinInfo: CoinInfo,
): RefTransaction[] =>
    coinInfo.type !== 'bitcoin'
        ? []
        : txs.filter(isTransactionWithHex).map(raw => {
              const tx = BitcoinJsTransaction.fromHex(raw.tx.hex, { network: coinInfo.network });
              return transformReferencedTransaction(tx);
          });

const transformAccountToOrigTransaction = ({
    tx,
    addresses,
    coinInfo,
}: {
    tx: AccountTransaction;
    coinInfo: CoinInfo;
    addresses?: AccountAddresses;
}) => {
    if (!tx.hex)
        throw TypedError('Method_InvalidParameter', `refTx: hex for ${tx.txid} not provided`);
    if (!addresses)
        throw TypedError('Method_InvalidParameter', `refTx: addresses for ${tx.txid} not provided`);

    const srcTx = BitcoinJsTransaction.fromHex(tx.hex, { network: coinInfo.network });
    return transformOrigTransaction({ ...tx.details, txid: tx.txid }, srcTx, addresses);
};

const transformAccountToReferencedTransaction = ({
    tx,
    coinInfo,
}: {
    tx: AccountTransaction;
    coinInfo: CoinInfo;
}) => {
    if (!tx.hex)
        throw TypedError('Method_InvalidParameter', `refTx: hex for ${tx.txid} not provided`);

    const srcTx = BitcoinJsTransaction.fromHex(tx.hex, { network: coinInfo.network });
    return transformReferencedTransaction(srcTx);
};

// Validate referenced transactions provided by the user.
// Data sent as response to TxAck needs to be strict.
// They should not contain any fields unknown/unexpected by protobuf.
export const validateReferencedTransactions = ({
    transactions,
    inputs,
    outputs,
    addresses,
    coinInfo,
}: {
    transactions?: (RefTransaction | AccountTransaction)[];
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    addresses?: AccountAddresses;
    coinInfo: CoinInfo;
}) => {
    if (!Array.isArray(transactions) || transactions.length === 0) return; // allow empty, they will be downloaded later...
    // collect sets of transactions defined by inputs/outputs
    const refTxs = requireReferencedTransactions(inputs) ? getReferencedTransactions(inputs) : [];
    const origTxs = getOrigTransactions(inputs, outputs); // NOTE: origTxs are used in RBF
    const transformedTxs: RefTransaction[] = transactions.map(tx => {
        // transform AccountTransaction to RefTransaction
        if ('details' in tx) {
            if (origTxs.includes(tx.txid)) {
                return transformAccountToOrigTransaction({ tx, addresses, coinInfo });
            }
            return transformAccountToReferencedTransaction({ tx, coinInfo });
        }
        // validate common fields
        // TODO: detailed params validation will be addressed in https://github.com/trezor/connect/pull/782
        // currently it's 1:1 with previous validation in SignTransaction.js method
        validateParams(tx, [
            { name: 'hash', type: 'string', required: true },
            { name: 'inputs', type: 'array', required: true },
            { name: 'version', type: 'number', required: true },
            { name: 'lock_time', type: 'number', required: true },
            { name: 'extra_data', type: 'string' },
            { name: 'timestamp', type: 'number' },
            { name: 'version_group_id', type: 'number' },
        ]);

        // check if referenced transaction is in expected format (RBF)
        if (origTxs.includes(tx.hash)) {
            // validate specific fields of origTx
            // protobuf.TxInput
            validateParams(tx, [{ name: 'outputs', type: 'array', required: true }]);
            // TODO: detailed validation will be addressed in #782
            return tx;
        }

        // validate specific fields of refTx
        validateParams(tx, [{ name: 'bin_outputs', type: 'array', required: true }]);
        tx.inputs.forEach(input => {
            validateParams(input, [
                { name: 'prev_hash', type: 'string', required: true },
                { name: 'prev_index', type: 'number', required: true },
                { name: 'script_sig', type: 'string', required: true },
                { name: 'sequence', type: 'number', required: true },
                { name: 'decred_tree', type: 'number' },
            ]);
        });

        return {
            hash: tx.hash,
            version: tx.version,
            extra_data: tx.extra_data,
            lock_time: tx.lock_time,
            timestamp: tx.timestamp,
            version_group_id: tx.version_group_id,
            expiry: tx.expiry,
            // make exact protobuf.PrevInput
            inputs: tx.inputs.map(input => ({
                prev_hash: input.prev_hash,
                prev_index: input.prev_index,
                // TODO: https://github.com/trezor/trezor-suite/issues/5297
                script_sig: input.script_sig!,
                // TODO: https://github.com/trezor/trezor-suite/issues/5297
                sequence: input.sequence!,
                decred_tree: input.decred_tree,
            })),
            // make exact protobuf.TxOutputBinType
            // TODO: https://github.com/trezor/trezor-suite/issues/5297
            bin_outputs: tx.bin_outputs!.map(output => ({
                amount: output.amount,
                script_pubkey: output.script_pubkey,
                decred_script_version: output.decred_script_version,
            })),
        };
    });

    // check if all required transactions defined by inputs/outputs were provided
    refTxs.concat(origTxs).forEach(hash => {
        if (!transformedTxs.find(tx => tx.hash === hash)) {
            throw TypedError('Method_InvalidParameter', `refTx: ${hash} not provided`);
        }
    });

    return transformedTxs;
};
