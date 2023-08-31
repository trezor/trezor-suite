/**
 * https://github.com/MetacoSA/NBitcoin/blob/master/NBitcoin/BIP158/GolombRiceFilter.cs
 * https://github.com/MetacoSA/NBitcoin/blob/ec3da1c2019a828e52d1885fc452ef55b6f72271/NBitcoin/Protocol/VarInt.cs#L81
 * https://github.com/zkSNACKs/WalletWasabi/blob/master/WalletWasabi/Backend/Models/FilterModel.cs
 * https://github.com/bcoin-org/golomb/blob/master/lib/golomb.js
 */
import Golomb from 'golomb';
import { U64 } from 'n64';

import { address as addressBjs, Network } from '@trezor/utxo-lib';

const M = new U64(1 << 20);
const KEY_SIZE = 16;

const createFilter = (data: Buffer) => {
    const filter = Golomb.fromNBytes(20, data);
    // In golomb package, M is hardcoded to 784931. With custom value, m must be calculated separately (as M * n).
    filter.m = M.mul(new U64(filter.n));
    return filter;
};

export const getBlockAddressScript = (address: string, network: Network) => {
    const script = addressBjs.toOutputScript(address, network);
    return Buffer.concat([Buffer.from([script.length + 6]), script]);
};

export const getMempoolAddressScript = (address: string, network: Network) =>
    addressBjs.toOutputScript(address, network);

const getFilter = (filterHex: string, keyBuffer: Buffer) => {
    const filter = createFilter(Buffer.from(filterHex, 'hex'));
    const key = keyBuffer.subarray(0, KEY_SIZE);
    return (script: Buffer) => filter.match(key, script);
};

export const getBlockFilter = (filterHex: string, blockHash: string) =>
    getFilter(filterHex, Buffer.from(blockHash, 'hex').reverse());

export const getMempoolFilter = (filterHex: string, txid: string) =>
    getFilter(filterHex, Buffer.from(txid, 'hex'));

const getMultiFilter = (filterHex: string, keyBuffer: Buffer) => {
    const filter = createFilter(Buffer.from(filterHex, 'hex'));
    const key = keyBuffer.subarray(0, KEY_SIZE);
    return (scripts: Buffer[]) => filter.matchAny(key, scripts);
};

export const getBlockMultiFilter = (filterHex: string, blockHash: string) =>
    getMultiFilter(filterHex, Buffer.from(blockHash, 'hex').reverse());

export const getMempoolMultiFilter = (filterHex: string, txid: string) =>
    getMultiFilter(filterHex, Buffer.from(txid, 'hex'));
