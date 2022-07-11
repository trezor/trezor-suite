// @ts-ignore
import * as GCSFilter from 'golomb';
// @ts-ignore
import { U64 } from 'n64';
import { address as addressBjs, networks, Network } from '@trezor/utxo-lib';

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

type SearchResult = {
    blockHeight: number;
    address: string;
    script: any;
};

export const search = (data: any, addresses: any[]) => {
    console.warn('search', data, addresses);
    const { blockHeight, blockHash, filter: filterHex } = data;
    const filter = createFilter(Buffer.from(filterHex, 'hex'));
    // const gfilter = GCSFilter.fromBytes(20, 0, blockFilter);
    // const gfilter = GCSFilter.fromRaw(blockFilter);
    // const gfilter = GCSFilter.fromNBytes(19, blockFilter);
    // const gfilter = new GCSFilter();
    // gfilter.data = blockFilter.slice(1); // blockFilter;
    // gfilter.n = 1;
    // gfilter.p = 20;
    // gfilter.m = new U64(1048576); // 1 << 20

    // console.warn('Gfilter', gfilter);

    const key = Buffer.from(blockHash, 'hex').reverse().slice(0, 16);
    const result: SearchResult[] = [];

    addresses.forEach(a => {
        const script = getAddressScript(a, networks.regtest);
        // console.log('Search for', a, weird, gfilter);
        if (filter.match(key, script)) {
            result.push({ blockHeight, address: a, script });
            console.log('---> FOUND in ', blockHeight, 'address', a, 'script', script);
        } else {
            // console.log('Not found', blockHeight, a);
        }
    });

    return result;
};
