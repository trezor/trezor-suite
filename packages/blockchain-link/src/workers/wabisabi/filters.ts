// @ts-ignore
import * as GCSFilter from 'golomb';
// @ts-ignore
import { U64 } from 'n64';
import { address as addressBjs, Network } from '@trezor/utxo-lib';

const createFilter = (data: Buffer) => {
    const filter = new GCSFilter();
    filter.data = data.slice(1);
    filter.n = 1;
    filter.p = 20;
    filter.m = new U64(1 << 20);
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
