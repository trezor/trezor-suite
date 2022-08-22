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

const createFilter = (data: Buffer) => {
    const filter = Golomb.fromNBytes(20, data);
    filter.m = M.mul(new U64(filter.n));
    return filter;
};

export const getAddressScript = (address: string, network: Network) => {
    const script = addressBjs.toOutputScript(address, network);
    return Buffer.concat([Buffer.from([script.length + 6]), script]);
};

export const getFilter = (filterHex: string, blockHash: string) => {
    const filter = createFilter(Buffer.from(filterHex, 'hex'));
    const key = Buffer.from(blockHash, 'hex').reverse().slice(0, 16);
    return (script: Buffer) => filter.match(key, script);
};
