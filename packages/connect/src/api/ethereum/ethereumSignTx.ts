/* eslint-disable @typescript-eslint/no-use-before-define */

import { serializeTransaction } from 'viem';

import type {
    EthereumAccessList,
    EthereumTransaction,
    EthereumTransactionEIP1559,
    PROTO,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema } from '@trezor/protobuf';

import { getEthereumDefinitions } from './ethereumDefinitions';
import type { TypedCall } from '../../device/DeviceCommands';
import { addHexPrefix } from '../../utils/formatUtils';

const splitString = (str?: string, len?: number): [string, string] => {
    if (str == null) {
        return ['', ''];
    }
    const first = str.slice(0, len);
    const second = str.slice(len);

    return [first, second];
};

type TxSignature = { v: `0x${string}`; r: `0x${string}`; s: `0x${string}` };

type TxFlowResponse =
    | { type: 'EthereumTxRequest'; message: PROTO.EthereumTxRequest }
    | { type: 'EthereumDefinitionRequest'; message: PROTO.EthereumDefinitionRequest };

async function processTxRequest(
    typedCall: TypedCall,
    request: PROTO.EthereumTxRequest,
    data?: string,
    chain_id?: number,
): Promise<TxSignature> {
    if (!request.data_length) {
        let v = request.signature_v;
        const r = request.signature_r;
        const s = request.signature_s;
        if (v == null || r == null || s == null) {
            throw ERRORS.TypedError('Runtime', 'processTxRequest: Unexpected request');
        }

        // recompute "v" value
        // from: https://github.com/kvhnuke/etherwallet/commit/288bd35497e00ad3947e9d11f60154bae1bf3c2f
        if (chain_id && v <= 1) {
            v += 2 * chain_id + 35;
        }

        return Promise.resolve({
            v: `0x${v.toString(16)}`,
            r: `0x${r}`,
            s: `0x${s}`,
        });
    }

    const [first, rest] = splitString(data, request.data_length * 2);
    const nextResponse = await typedCall(
        'EthereumTxAck',
        ['EthereumTxRequest', 'EthereumDefinitionRequest'],
        { data_chunk: first },
    );

    return handleTxFlowResponse(typedCall, nextResponse, rest, chain_id);
}

async function processDefinitionRequest(
    typedCall: TypedCall,
    request: PROTO.EthereumDefinitionRequest,
    data?: string,
    chain_id?: number,
): Promise<TxSignature> {
    const definitions = await getEthereumDefinitions({
        chainId: request.chain_id,
        contractAddress: request.token_address,
        functionSignature: request.func_sig,
    });

    const nextResponse = await typedCall(
        'EthereumDefinitionAck',
        ['EthereumTxRequest', 'EthereumDefinitionRequest'],
        { definitions },
    );

    return handleTxFlowResponse(typedCall, nextResponse, data, chain_id);
}

function handleTxFlowResponse(
    typedCall: TypedCall,
    response: TxFlowResponse,
    data?: string,
    chain_id?: number,
): Promise<TxSignature> {
    if (response.type === 'EthereumDefinitionRequest') {
        return processDefinitionRequest(typedCall, response.message, data, chain_id);
    }

    return processTxRequest(typedCall, response.message, data, chain_id);
}

const ifNotUndefined = <T, U>(value: T | undefined, convert: (value: T) => U): U | undefined =>
    value === undefined ? undefined : convert(value);

const toBigInt = (value: string) => BigInt(addHexPrefix(value));

export const serializeEthereumTx = (
    tx: EthereumTransactionEIP1559 | EthereumTransaction,
    signature: { v: `0x${string}`; r: `0x${string}`; s: `0x${string}` },
    isLegacy: boolean,
) =>
    serializeTransaction(
        {
            value: toBigInt(tx.value),
            nonce: Number(addHexPrefix(tx.nonce)),
            data: ifNotUndefined(tx.data, addHexPrefix),
            to: ifNotUndefined(tx.to || undefined, addHexPrefix), // empty ("") address must be omitted completely
            gas: ifNotUndefined(tx.gasLimit, toBigInt),
            chainId: tx.chainId,
            ...(isLegacy
                ? {
                      type: 'legacy',
                      gasPrice: ifNotUndefined(tx.gasPrice, toBigInt),
                  }
                : {
                      type: 'eip1559',
                      maxFeePerGas: ifNotUndefined(tx.maxFeePerGas, toBigInt),
                      maxPriorityFeePerGas: ifNotUndefined(tx.maxPriorityFeePerGas, toBigInt),
                      accessList: ('accessList' in tx ? tx.accessList : undefined)?.map(
                          ({ address, storageKeys }) => ({
                              address: addHexPrefix(address),
                              storageKeys: storageKeys.map(addHexPrefix),
                          }),
                      ),
                  }),
        },
        { ...signature, v: toBigInt(signature.v) },
    );

const stripLeadingZeroes = (str: string) => {
    while (str.startsWith('00')) {
        str = str.slice(2);
    }

    return str;
};

export const ethereumSignTx = async (
    // todo: don't we change parameters here to object?
    typedCall: TypedCall,
    address_n: number[],
    to: string | null,
    value: string,
    gas_limit: string,
    gas_price: string,
    nonce: string,
    chain_id: number,
    chunkify: boolean,
    data?: string,
    tx_type?: number,
    definitions?: MessagesSchema.EthereumDefinitions,
    payment_req?: PROTO.PaymentRequest,
) => {
    const length = data == null ? 0 : data.length / 2;

    const [first, rest] = splitString(data, 1024 * 2);

    let message: PROTO.EthereumSignTx = {
        address_n,
        chain_id,
        nonce: stripLeadingZeroes(nonce),
        gas_price: stripLeadingZeroes(gas_price),
        gas_limit: stripLeadingZeroes(gas_limit),
        to: to || undefined,
        value: stripLeadingZeroes(value),
        definitions,
        chunkify,
        payment_req,
        supports_definition_request: true,
    };

    if (length !== 0) {
        message = {
            ...message,
            data_length: length,
            data_initial_chunk: first,
        };
    }

    if (tx_type !== null) {
        message = {
            ...message,
            tx_type,
        };
    }

    const response = await typedCall(
        'EthereumSignTx',
        ['EthereumTxRequest', 'EthereumDefinitionRequest'],
        message,
    );

    return handleTxFlowResponse(typedCall, response, rest, chain_id);
};

export const ethereumSignTxEIP1559 = async (
    // todo: don't we change parameters here to object?
    typedCall: TypedCall,
    address_n: number[],
    to: string | null,
    value: string,
    gas_limit: string,
    max_gas_fee: string,
    max_priority_fee: string,
    nonce: string,
    chain_id: number,
    chunkify: boolean,
    data?: string,
    access_list?: EthereumAccessList[],
    definitions?: MessagesSchema.EthereumDefinitions,
    payment_req?: PROTO.PaymentRequest,
) => {
    const length = data == null ? 0 : data.length / 2;

    const [first, rest] = splitString(data, 1024 * 2);

    const message = {
        address_n,
        nonce: stripLeadingZeroes(nonce),
        max_gas_fee: stripLeadingZeroes(max_gas_fee),
        max_priority_fee: stripLeadingZeroes(max_priority_fee),
        gas_limit: stripLeadingZeroes(gas_limit),
        to: to || undefined,
        value: stripLeadingZeroes(value),
        data_length: length,
        data_initial_chunk: first,
        chain_id,
        access_list: (access_list || []).map(a => ({
            address: a.address,
            storage_keys: a.storageKeys,
        })),
        definitions,
        chunkify,
        payment_req,
        supports_definition_request: true,
    };

    const response = await typedCall(
        'EthereumSignTxEIP1559',
        ['EthereumTxRequest', 'EthereumDefinitionRequest'],
        message,
    );

    return handleTxFlowResponse(typedCall, response, rest);
};
