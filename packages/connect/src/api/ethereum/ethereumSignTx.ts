// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/ethereumSignTx.js

import { Common, Chain, Hardfork } from '@ethereumjs/common';
import { FeeMarketEIP1559TxData, TransactionFactory, LegacyTxData } from '@ethereumjs/tx';

import { MessagesSchema } from '@trezor/protobuf';
import { PROTO, ERRORS } from '../../constants';
import type { TypedCall } from '../../device/DeviceCommands';
import type { EthereumAccessList } from '../../types/api/ethereum';
import { addHexPrefix, deepTransform } from '../../utils/formatUtils';

const splitString = (str?: string, len?: number) => {
    if (str == null) {
        return ['', ''];
    }
    const first = str.slice(0, len);
    const second = str.slice(len);

    return [first, second];
};

const processTxRequest = async (
    typedCall: TypedCall,
    request: PROTO.EthereumTxRequest,
    data?: string,
    chain_id?: number,
): Promise<{
    v: string;
    r: string;
    s: string;
}> => {
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
    const response = await typedCall('EthereumTxAck', 'EthereumTxRequest', { data_chunk: first });

    return processTxRequest(typedCall, response.message, rest, chain_id);
};

const deepHexPrefix = deepTransform(addHexPrefix);

export const serializeEthereumTx = (
    txData: LegacyTxData | FeeMarketEIP1559TxData,
    chainId: number,
) => {
    // @ethereumjs/tx doesn't support ETC (chain 61) by default
    // and it needs to be declared as custom chain
    // see: https://github.com/ethereumjs/ethereumjs-tx/blob/master/examples/custom-chain-tx.ts
    const txOptions =
        chainId === 61
            ? {
                  common: Common.custom(
                      { name: 'ethereum-classic', networkId: 1, chainId: 61 },
                      { baseChain: Chain.Mainnet, hardfork: Hardfork.Petersburg },
                  ),
              }
            : { chain: chainId };

    const ethTx = TransactionFactory.fromTxData(deepHexPrefix(txData), txOptions);

    return `0x${Buffer.from(ethTx.serialize()).toString('hex')}`;
};

const stripLeadingZeroes = (str: string) => {
    while (/^00/.test(str)) {
        str = str.slice(2);
    }

    return str;
};

export const ethereumSignTx = async (
    // todo: don't we change parameters here to object?
    typedCall: TypedCall,
    address_n: number[],
    to: string,
    value: string,
    gas_limit: string,
    gas_price: string,
    nonce: string,
    chain_id: number,
    chunkify: boolean,
    data?: string,
    tx_type?: number,
    definitions?: MessagesSchema.EthereumDefinitions,
) => {
    const length = data == null ? 0 : data.length / 2;

    const [first, rest] = splitString(data, 1024 * 2);

    let message: PROTO.EthereumSignTx = {
        address_n,
        chain_id,
        nonce: stripLeadingZeroes(nonce),
        gas_price: stripLeadingZeroes(gas_price),
        gas_limit: stripLeadingZeroes(gas_limit),
        to,
        value: stripLeadingZeroes(value),
        definitions,
        chunkify,
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

    const response = await typedCall('EthereumSignTx', 'EthereumTxRequest', message);

    return processTxRequest(typedCall, response.message, rest, chain_id);
};

export const ethereumSignTxEIP1559 = async (
    // todo: don't we change parameters here to object?
    typedCall: TypedCall,
    address_n: number[],
    to: string,
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
) => {
    const length = data == null ? 0 : data.length / 2;

    const [first, rest] = splitString(data, 1024 * 2);

    const message = {
        address_n,
        nonce: stripLeadingZeroes(nonce),
        max_gas_fee: stripLeadingZeroes(max_gas_fee),
        max_priority_fee: stripLeadingZeroes(max_priority_fee),
        gas_limit: stripLeadingZeroes(gas_limit),
        to,
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
    };

    const response = await typedCall('EthereumSignTxEIP1559', 'EthereumTxRequest', message);

    return processTxRequest(typedCall, response.message, rest);
};
