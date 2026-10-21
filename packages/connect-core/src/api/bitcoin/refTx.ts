// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/refTx.js

import type {
    AccountAddresses,
    AccountTransaction,
    BitcoinNetworkInfo,
    CoinInfo,
    RefTransaction,
    TransactionOptions,
} from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert, Type } from '@trezor/schema-utils';
import { arrayPartition, bufferUtils, isNotUndefined, throwError, unique } from '@trezor/utils';
import {
    type TxInput as BitcoinJsInput,
    type TxOutput as BitcoinJsOutput,
    Transaction as BitcoinJsTransaction,
    type Network,
} from '@trezor/utxo-lib';

import { parseOutputScript } from './outputs';
import { getHDPath, getOutputScriptType, getScriptType } from '../../utils/pathUtils';

type RefInput = Pick<PROTO.TxInputType, 'script_type' | 'prev_hash' | 'orig_hash'>;
type RefOutput = Pick<PROTO.TxOutputType, 'orig_hash'>;

export const getPreviousTxids = (
    inputs: RefInput[],
    { version }: Pick<TransactionOptions, 'version'> = {},
    { shortcut }: Partial<Pick<CoinInfo, 'shortcut'>> = {},
) => {
    // Referenced transactions are not required if:
    // - zcash tx version is NU5 (or greater)
    // - all internal inputs script_type === SPENDTAPROOT
    const prevRequired =
        shortcut === 'ZEC' || shortcut === 'TAZ'
            ? !(version && version >= 5)
            : inputs.some(
                  input => input.script_type !== 'SPENDTAPROOT' && input.script_type !== 'EXTERNAL',
              );

    return prevRequired
        ? unique(inputs.map(({ prev_hash }) => prev_hash).filter(isNotUndefined))
        : [];
};

export const getOriginalTxids = (inputs: RefInput[], outputs: RefOutput[]) =>
    unique([...inputs, ...outputs].map(({ orig_hash }) => orig_hash).filter(isNotUndefined));

const parseTransactionHex = (network?: Network) => (hex: string) =>
    BitcoinJsTransaction.fromHex(hex, { network });

export const parseTransactionHexes = (network?: Network) => (hexes: string[]) =>
    hexes.map(parseTransactionHex(network));

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
    }

    return refTx;
};

// Transform orig transactions from Blockbook (blockchain-link) to Trezor format
const transformOrigTransaction = (
    tx: BitcoinJsTransaction,
    coinInfo: BitcoinNetworkInfo,
    currentInputs: PROTO.TxInputType[],
    addresses: AccountAddresses | undefined,
): RefTransaction => {
    if (!addresses) {
        throw TypedError(
            'Method_InvalidParameter',
            `transformOrigTransactions: addresses for ${tx.getId()} not provided`,
        );
    }

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
                if (typeof parsed.data !== 'string') {
                    throw TypedError(
                        'Method_InvalidParameter',
                        `transformOrigTransactions: invalid op_return_data at ${tx.getId()} [${i}]`,
                    );
                }

                return {
                    script_type: 'PAYTOOPRETURN',
                    amount: '0',
                    op_return_data: parsed.data,
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

const RefTxShape = Type.Object({
    hash: Type.String(),
    version: Type.Number(),
    lock_time: Type.Number(),
    extra_data: Type.Optional(Type.String()),
    timestamp: Type.Optional(Type.Number()),
    version_group_id: Type.Optional(Type.Number()),
});

const PrevTxShape = Type.Composite([
    RefTxShape,
    Type.Object({
        inputs: Type.Array(PROTO.PrevInput, { minItems: 1 }),
        bin_outputs: Type.Array(PROTO.TxOutputBinType, { minItems: 1 }),
    }),
]);

const OrigTxShape = Type.Composite([
    RefTxShape,
    Type.Object({
        inputs: Type.Array(PROTO.TxInput, { minItems: 1 }),
        outputs: Type.Array(PROTO.TxOutputType, { minItems: 1 }),
    }),
]);

const getTransactionHex = ({ hex, txid }: AccountTransaction) =>
    hex || throwError(TypedError('Method_InvalidParameter', `refTx: hex for ${txid} not provided`));

export const transformRawTransactions = ({
    transactions,
    inputs,
    addresses,
    coinInfo,
    origTxids,
}: {
    transactions: AccountTransaction[];
    inputs: PROTO.TxInputType[];
    addresses?: AccountAddresses;
    coinInfo: BitcoinNetworkInfo;
    origTxids: string[];
}): RefTransaction[] => {
    const [origAccountTxs, prevAccountTxs] = arrayPartition(transactions, tx =>
        origTxids.includes(tx.txid),
    );

    const transformedOrigTxs = origAccountTxs
        .map(getTransactionHex)
        .map(parseTransactionHex(coinInfo.network))
        .map(srcTx => transformOrigTransaction(srcTx, coinInfo, inputs, addresses));

    const transformedPrevTxs = prevAccountTxs
        .map(getTransactionHex)
        .map(parseTransactionHex(coinInfo.network))
        .map(transformReferencedTransaction);

    return transformedOrigTxs.concat(transformedPrevTxs);
};

export const assertRefTransactions = ({
    transactions,
    origTxids,
}: {
    transactions: RefTransaction[];
    origTxids: string[];
}) => {
    const [origRefTxs, prevRefTxs] = arrayPartition(transactions, tx =>
        origTxids.includes(tx.hash),
    );

    origRefTxs.forEach(tx => Assert(OrigTxShape, tx));
    prevRefTxs.forEach(tx => Assert(PrevTxShape, tx));
};
