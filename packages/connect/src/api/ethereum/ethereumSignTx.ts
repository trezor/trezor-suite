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

// Signed EIP-7702 authorization returned by the device alongside the transaction signature.
type SignedAuthorization = {
    chainId: number;
    address: `0x${string}`;
    nonce: number;
    yParity: number;
    r: `0x${string}`;
    s: `0x${string}`;
};

type TxResult = TxSignature & { authorizationList?: SignedAuthorization[] };

type TxFlowResponse =
    | { type: 'EthereumTxRequest'; message: PROTO.EthereumTxRequest }
    | { type: 'EthereumDefinitionRequest'; message: PROTO.EthereumDefinitionRequest };

// Tuple integers are minimal big-endian byte strings, so an empty value stands for zero. A value
// above the safe integer range is rejected rather than silently rounded, which would otherwise
// desync the serialized authorization from its signature. `ethereumSignTransaction` already rejects
// such requests before signing, so this is the last-resort guard.
const bytesHexToNumber = (hex: string) => {
    const value = hex ? BigInt(addHexPrefix(hex)) : 0n;
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw ERRORS.TypedError(
            'Runtime',
            'EIP-7702 authorization value exceeds the safe integer range.',
        );
    }

    return Number(value);
};

// The device returns each EIP-7702 authorization as a tuple [chain_id, delegate, nonce, y_parity, r, s].
const AUTH7702_TUPLE_LENGTH = 6;

export const parseAuth7702List = (
    list: PROTO.EthereumTxRequest['auth7702_list'],
): SignedAuthorization[] | undefined => {
    const tuples = (list ?? []).filter(({ items }) => items.length > 0);
    if (tuples.length === 0) return undefined;

    return tuples.map(({ items }) => {
        // A well-formed authorization always has all six elements (zero integers are minimal-
        // encoded as empty byte strings but stay present). Fail loudly on a short tuple instead of
        // padding it with zeros, which would serialize an authorization the device never signed.
        if (items.length !== AUTH7702_TUPLE_LENGTH) {
            throw ERRORS.TypedError(
                'Runtime',
                'Malformed EIP-7702 authorization tuple returned by the device.',
            );
        }
        // The guard above ensures all six elements are present; assert the shape so the type
        // checker (noUncheckedIndexedAccess) does not treat each element as possibly undefined.
        const [chainId, delegate, nonce, yParity, r, s] = items as [
            string,
            string,
            string,
            string,
            string,
            string,
        ];

        return {
            chainId: bytesHexToNumber(chainId),
            address: addHexPrefix(delegate),
            nonce: bytesHexToNumber(nonce),
            yParity: bytesHexToNumber(yParity),
            r: addHexPrefix(r),
            s: addHexPrefix(s),
        };
    });
};

async function processTxRequest(
    typedCall: TypedCall,
    request: PROTO.EthereumTxRequest,
    data?: string,
    chain_id?: number,
): Promise<TxResult> {
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
            authorizationList: parseAuth7702List(request.auth7702_list),
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
): Promise<TxResult> {
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
): Promise<TxResult> {
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
    authorizationList?: SignedAuthorization[],
) => {
    const eip1559Fields = {
        maxFeePerGas: ifNotUndefined(tx.maxFeePerGas, toBigInt),
        maxPriorityFeePerGas: ifNotUndefined(tx.maxPriorityFeePerGas, toBigInt),
        accessList: ('accessList' in tx ? tx.accessList : undefined)?.map(
            ({ address, storageKeys }) => ({
                address: addHexPrefix(address),
                storageKeys: storageKeys.map(addHexPrefix),
            }),
        ),
    };

    const typeSpecificFields = () => {
        if (isLegacy) {
            return { type: 'legacy' as const, gasPrice: ifNotUndefined(tx.gasPrice, toBigInt) };
        }
        // An authorization list turns the EIP-1559 transaction into a type-4 (set-code) one.
        if (authorizationList && authorizationList.length > 0) {
            return { type: 'eip7702' as const, ...eip1559Fields, authorizationList };
        }

        return { type: 'eip1559' as const, ...eip1559Fields };
    };

    return serializeTransaction(
        {
            value: toBigInt(tx.value),
            nonce: Number(addHexPrefix(tx.nonce)),
            data: ifNotUndefined(tx.data, addHexPrefix),
            to: ifNotUndefined(tx.to || undefined, addHexPrefix), // empty ("") address must be omitted completely
            gas: ifNotUndefined(tx.gasLimit, toBigInt),
            chainId: tx.chainId,
            ...typeSpecificFields(),
        },
        { ...signature, v: toBigInt(signature.v) },
    );
};

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
    auth7702?: PROTO.EthereumSignTxEIP1559['auth7702'],
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
        auth7702,
    };

    const response = await typedCall(
        'EthereumSignTxEIP1559',
        ['EthereumTxRequest', 'EthereumDefinitionRequest'],
        message,
    );

    return handleTxFlowResponse(typedCall, response, rest);
};
