/**
 * https://github.com/MetacoSA/NBitcoin/blob/master/NBitcoin/BIP158/GolombRiceFilter.cs
 * https://github.com/MetacoSA/NBitcoin/blob/ec3da1c2019a828e52d1885fc452ef55b6f72271/NBitcoin/Protocol/VarInt.cs#L81
 * https://github.com/zkSNACKs/WalletWasabi/blob/master/WalletWasabi/Backend/Models/FilterModel.cs
 * https://github.com/bcoin-org/golomb/blob/master/lib/golomb.js
 */
import Golomb from 'golomb';
import { U64 } from 'n64';

import { address as addressBjs, Network } from '@trezor/utxo-lib';

const P_DEFAULT = 20;
const M_DEFAULT = 1 << 20;
const KEY_SIZE = 16;
const ZERO_KEY = Buffer.alloc(KEY_SIZE);

type FilterParams = {
    P?: number;
    M?: number;
    key?: string;
};

const createFilter = (data: Buffer, { P = P_DEFAULT, M = M_DEFAULT }) => {
    const filter = Golomb.fromNBytes(P, data);
    // In golomb package, M is hardcoded to 784931. With custom value, m must be calculated separately (as M * n).
    filter.m = new U64(M).mul(new U64(filter.n));

    return filter;
};

export const getAddressScript = (address: string, network: Network) =>
    addressBjs.toOutputScript(address, network);

export const getFilter = (filterHex: string, { P, M, key }: FilterParams = {}) => {
    if (!filterHex) return () => false;
    const filter = createFilter(Buffer.from(filterHex, 'hex'), { P, M });
    const keyBuffer = key ? Buffer.from(key, 'hex').subarray(0, KEY_SIZE) : ZERO_KEY;

    return (script: Buffer) => filter.match(keyBuffer, script);
};

export const getMultiFilter = (filterHex: string, { P, M, key }: FilterParams = {}) => {
    if (!filterHex) return () => false;
    const filter = createFilter(Buffer.from(filterHex, 'hex'), { P, M });
    const keyBuffer = key ? Buffer.from(key, 'hex').subarray(0, KEY_SIZE) : ZERO_KEY;

    return (scripts: Buffer[]) => !!scripts.length && filter.matchAny(keyBuffer, scripts);
};
