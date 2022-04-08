// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/signtx-legacy.js

import { PROTO, ERRORS } from '../../constants';
import type { BitcoinNetworkInfo } from '../../types';
import type { TypedCall } from '../../device/DeviceCommands';
import type {
    RefTransaction,
    TransactionOptions,
    SignedTransaction,
} from '../../types/api/signTransaction';

type RefTxs = { [hash: string]: RefTransaction };
type Props = {
    typedCall: TypedCall;
    txRequest: PROTO.TxRequest;
    refTxs: RefTxs;
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
    serializedTx: string[];
    signatures: string[];
};

const requestPrevTxInfo = ({
    txRequest: { request_type, details },
    refTxs,
}: Props): PROTO.TxAckResponse => {
    const { tx_hash } = details;
    if (!tx_hash) {
        throw ERRORS.TypedError('Runtime', 'requestPrevTxInfo: unknown details.tx_hash');
    }
    const tx = refTxs[tx_hash.toLowerCase()];
    if (!tx) {
        throw ERRORS.TypedError('Runtime', `requestPrevTxInfo: Requested unknown tx: ${tx_hash}`);
    }
    if (!tx.bin_outputs) {
        throw ERRORS.TypedError('Runtime', `requestPrevTxInfo: bin_outputs not set tx: ${tx_hash}`);
    }
    if (request_type === 'TXINPUT') {
        return { inputs: [tx.inputs[details.request_index]] };
    }
    if (request_type === 'TXOUTPUT') {
        return { bin_outputs: [tx.bin_outputs[details.request_index]] };
    }
    if (request_type === 'TXEXTRADATA') {
        if (typeof details.extra_data_len !== 'number') {
            throw ERRORS.TypedError('Runtime', 'requestPrevTxInfo: Missing extra_data_len');
        }
        if (typeof details.extra_data_offset !== 'number') {
            throw ERRORS.TypedError('Runtime', 'requestPrevTxInfo: Missing extra_data_offset');
        }
        if (typeof tx.extra_data !== 'string') {
            throw ERRORS.TypedError(
                'Runtime',
                `requestPrevTxInfo: No extra data for transaction ${tx.hash}`,
            );
        }
        const data = tx.extra_data;
        const dataLen = details.extra_data_len;
        const dataOffset = details.extra_data_offset;
        const extra_data = data.substring(dataOffset * 2, (dataOffset + dataLen) * 2);
        return { extra_data };
    }
    if (request_type === 'TXMETA') {
        const data = tx.extra_data;
        const meta = {
            version: tx.version,
            lock_time: tx.lock_time,
            inputs_cnt: tx.inputs.length,
            outputs_cnt: tx.bin_outputs.length,
            timestamp: tx.timestamp,
            version_group_id: tx.version_group_id,
            expiry: tx.expiry,
            branch_id: tx.branch_id,
        };

        if (typeof data === 'string' && data.length !== 0) {
            return {
                ...meta,
                extra_data_len: data.length / 2,
            };
        }
        return meta;
    }
    throw ERRORS.TypedError('Runtime', `requestPrevTxInfo: Unknown request type: ${request_type}`);
};

const requestSignedTxInfo = ({
    txRequest: { request_type, details },
    inputs,
    outputs,
}: Props): PROTO.TxAckResponse => {
    if (request_type === 'TXINPUT') {
        return { inputs: [inputs[details.request_index]] };
    }
    if (request_type === 'TXOUTPUT') {
        return { outputs: [outputs[details.request_index]] };
    }
    if (request_type === 'TXMETA') {
        throw ERRORS.TypedError(
            'Runtime',
            'requestSignedTxInfo: Cannot read TXMETA from signed transaction',
        );
    }
    if (request_type === 'TXEXTRADATA') {
        throw ERRORS.TypedError(
            'Runtime',
            'requestSignedTxInfo: Cannot read TXEXTRADATA from signed transaction',
        );
    }
    throw ERRORS.TypedError(
        'Runtime',
        `requestSignedTxInfo: Unknown request type: ${request_type}`,
    );
};

// requests information about a transaction
// can be either signed transaction itself of prev transaction
const requestTxAck = (props: Props) => {
    const { tx_hash } = props.txRequest.details;
    if (tx_hash) {
        return requestPrevTxInfo(props);
    }
    return requestSignedTxInfo(props);
};

const saveTxSignatures = (
    txRequest: PROTO.TxRequestSerializedType,
    serializedTx: string[],
    signatures: string[],
) => {
    if (!txRequest) return;
    const { signature_index, signature, serialized_tx } = txRequest;
    if (serialized_tx) {
        serializedTx.push(serialized_tx);
    }
    if (typeof signature_index === 'number') {
        if (!signature) {
            throw ERRORS.TypedError(
                'Runtime',
                'saveTxSignatures: Unexpected null in trezor:TxRequestSerialized signature.',
            );
        }
        signatures[signature_index] = signature;
    }
};

const processTxRequest = async (
    props: Props,
): Promise<{ signatures: string[]; serializedTx: string }> => {
    const { typedCall, txRequest, refTxs, inputs, outputs, serializedTx, signatures } = props;
    if (txRequest.serialized) saveTxSignatures(txRequest.serialized, serializedTx, signatures);
    if (txRequest.request_type === 'TXFINISHED') {
        return Promise.resolve({
            signatures,
            serializedTx: serializedTx.join(''),
        });
    }

    const txAck = requestTxAck(props);
    const { message } = await typedCall('TxAck', 'TxRequest', { tx: txAck });
    return processTxRequest({
        typedCall,
        txRequest: message,
        refTxs,
        inputs,
        outputs,
        serializedTx,
        signatures,
    });
};

export const signTxLegacy = async (
    typedCall: TypedCall,
    inputs: PROTO.TxInputType[],
    outputs: PROTO.TxOutputType[],
    refTxsArray: RefTransaction[],
    options: TransactionOptions,
    coinInfo: BitcoinNetworkInfo,
): Promise<SignedTransaction> => {
    const refTxs: RefTxs = {};
    refTxsArray.forEach(tx => {
        refTxs[tx.hash.toLowerCase()] = tx;
    });

    const { message } = await typedCall('SignTx', 'TxRequest', {
        ...options,
        inputs_count: inputs.length,
        outputs_count: outputs.length,
        coin_name: coinInfo.name,
    });

    return processTxRequest({
        typedCall,
        txRequest: message,
        refTxs,
        inputs,
        outputs,
        serializedTx: [],
        signatures: [],
    });
};
