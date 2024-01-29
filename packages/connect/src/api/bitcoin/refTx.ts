// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/refTx.js

import {
    address as BitcoinJsAddress,
    payments as BitcoinJsPayments,
    Transaction as BitcoinJsTransaction,
    Network,
} from '@trezor/utxo-lib';
import * as bufferUtils from '@trezor/utils/lib/bufferUtils';
import { getHDPath, getScriptType, getOutputScriptType } from '../../utils/pathUtils';
import { TypedError } from '../../constants/errors';
import type {
    TxInput as BitcoinJsInput,
    TxOutput as BitcoinJsOutput,
} from '@trezor/utxo-lib/lib/transaction/base';
import type {
    CoinInfo,
    AccountAddresses,
    AccountTransaction,
    BitcoinNetworkInfo,
} from '../../types';
import type { RefTransaction, TransactionOptions } from '../../types/api/bitcoin';
import { PROTO } from '../../constants';
import { Assert, Type } from '@trezor/schema-utils';

// Referenced transactions are not required if:
// - all internal inputs script_type === SPENDTAPROOT
// - zcash tx version is NU5 (or greater)
export const requireReferencedTransactions = (
    inputs: PROTO.TxInputType[],
    coinInfo?: CoinInfo,
    options: TransactionOptions = {},
): boolean => {
    if (coinInfo?.shortcut === 'ZEC' || coinInfo?.shortcut === 'TAZ') {
        return !(options.version && options.version >= 5);
    }
    const inputTypes = ['SPENDTAPROOT', 'EXTERNAL'];
    return !!inputs.find(input => !inputTypes.find(t => t === input.script_type));
};

// Get array of unique referenced transactions ids
export const getReferencedTransactions = (inputs: PROTO.TxInputType[]): string[] => {
    const result: string[] = [];
    inputs.forEach(input => {
        if (input.prev_hash && !result.includes(input.prev_hash)) {
            result.push(input.prev_hash);
        }
    });
    return result;
};

// Get array of unique original transactions ids (used in rbf)
export const getOrigTransactions = (
    inputs: PROTO.TxInputType[],
    outputs: PROTO.TxOutputType[],
): string[] => {
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

export const parseTransactionHexes = (network?: Network) => (hexes: string[]) =>
    hexes.map(hex => BitcoinJsTransaction.fromHex(hex, { network }));

// extend refTx object with optional data
const enhanceTransaction = (refTx: RefTransaction, srcTx: BitcoinJsTransaction): RefTransaction => {
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

const parseOutputScript = (output: Buffer, network?: Network) => {
    try {
        const address = BitcoinJsAddress.fromOutputScript(output, network);
        return { type: 'address', address } as const;
    } catch {
        try {
            const { data } = BitcoinJsPayments.embed({ output }, { validate: true });
            return { type: 'data', data } as const;
        } catch {
            return { type: 'unknown' } as const;
        }
    }
};

// Transform orig transactions from Blockbook (blockchain-link) to Trezor format
const transformOrigTransaction = (
    tx: BitcoinJsTransaction,
    coinInfo: BitcoinNetworkInfo,
    currentInputs: PROTO.TxInputType[],
    addresses: AccountAddresses,
): RefTransaction => {
    // inputs, required by TXORIGINPUT (TxAckInput) request from Trezor
    const inputsMap = (input: BitcoinJsInput, i: number) => {
        const prev_hash = bufferUtils.reverseBuffer(input.hash).toString('hex');
        const currentInput = currentInputs.find(
            inp => inp.prev_hash === prev_hash && inp.prev_index === input.index,
        );
        if (!currentInput?.address_n) {
            throw TypedError(
                'Method_InvalidParameter',
                `transformOrigTransactions: invalid input at ${tx.getId()} [${i}]`,
            );
        }

        return {
            address_n: currentInput.address_n,
            prev_hash,
            prev_index: input.index,
            script_sig: input.script.toString('hex'),
            sequence: input.sequence,
            script_type: getScriptType(currentInput.address_n),
            multisig: undefined, // TODO
            amount: currentInput.amount,
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
        const parsed = parseOutputScript(output.script, coinInfo.network);
        switch (parsed.type) {
            case 'data': {
                const op_return_data = parsed.data?.shift()?.toString('hex'); // shift OP code
                if (typeof op_return_data !== 'string') {
                    throw TypedError(
                        'Method_InvalidParameter',
                        `transformOrigTransactions: invalid op_return_data at ${tx.getId()} [${i}]`,
                    );
                }
                return {
                    script_type: 'PAYTOOPRETURN',
                    amount: '0',
                    op_return_data,
                };
            }
            case 'address': {
                const { address } = parsed;
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
            }
            case 'unknown':
            default:
                throw TypedError(
                    'Method_InvalidParameter',
                    `transformOrigTransactions: invalid output at ${tx.getId()} [${i}]`,
                );
        }
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

export const transformOrigTransactions = (
    txs: BitcoinJsTransaction[],
    coinInfo: BitcoinNetworkInfo,
    currentInputs: PROTO.TxInputType[],
    addresses: AccountAddresses,
): RefTransaction[] =>
    txs.map(tx => transformOrigTransaction(tx, coinInfo, currentInputs, addresses));

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

export const transformReferencedTransactions = (txs: BitcoinJsTransaction[]): RefTransaction[] =>
    txs.map(transformReferencedTransaction);

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
    coinInfo: BitcoinNetworkInfo;
}): RefTransaction[] | undefined => {
    if (!Array.isArray(transactions) || transactions.length === 0) return; // allow empty, they will be downloaded later...
    // collect sets of transactions defined by inputs/outputs
    const refTxs = requireReferencedTransactions(inputs) ? getReferencedTransactions(inputs) : [];
    const origTxs = getOrigTransactions(inputs, outputs); // NOTE: origTxs are used in RBF
    const transformedTxs: RefTransaction[] = transactions.map(tx => {
        // transform AccountTransaction to RefTransaction
        if ('details' in tx) {
            if (!tx.hex)
                throw TypedError(
                    'Method_InvalidParameter',
                    `refTx: hex for ${tx.txid} not provided`,
                );

            const srcTx = BitcoinJsTransaction.fromHex(tx.hex, { network: coinInfo.network });

            if (origTxs.includes(tx.txid)) {
                if (!addresses)
                    throw TypedError(
                        'Method_InvalidParameter',
                        `refTx: addresses for ${tx.txid} not provided`,
                    );
                return transformOrigTransaction(srcTx, coinInfo, inputs, addresses);
            }
            return transformReferencedTransaction(srcTx);
        }
        // validate common fields
        Assert(
            Type.Object({
                hash: Type.String(),
                version: Type.Number(),
                lock_time: Type.Number(),
                extra_data: Type.Optional(Type.String()),
                timestamp: Type.Optional(Type.Number()),
                version_group_id: Type.Optional(Type.Number()),
            }),
            tx,
        );

        // check if referenced transaction is in expected format (RBF)
        if (origTxs.includes(tx.hash)) {
            // validate specific fields of origTx
            Assert(
                Type.Object({
                    inputs: Type.Array(PROTO.TxInput, { minItems: 1 }),
                    outputs: Type.Array(PROTO.TxOutputType, { minItems: 1 }),
                }),
                tx,
            );
            return tx;
        }

        // validate specific fields of refTx
        Assert(
            Type.Object({
                inputs: Type.Array(PROTO.PrevInput, { minItems: 1 }),
                bin_outputs: Type.Array(PROTO.TxOutputBinType, { minItems: 1 }),
            }),
            tx,
        );

        return {
            hash: tx.hash,
            version: tx.version,
            extra_data: tx.extra_data,
            lock_time: tx.lock_time,
            timestamp: tx.timestamp,
            version_group_id: tx.version_group_id,
            expiry: tx.expiry,
            inputs: tx.inputs.map(input => ({
                prev_hash: input.prev_hash,
                prev_index: input.prev_index,
                script_sig: input.script_sig,
                sequence: input.sequence,
                decred_tree: input.decred_tree,
            })),
            bin_outputs: tx.bin_outputs.map(output => ({
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
