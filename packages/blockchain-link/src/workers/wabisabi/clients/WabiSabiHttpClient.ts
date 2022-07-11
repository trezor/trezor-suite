import { EventEmitter } from 'events';
import { search } from './filters';
import { httpRequest } from './http';

interface Options {
    url: string;
    timeout?: number;
}

// const baseUrl = 'http://localhost:37127/api/v4/btc';
const baseUrl = 'http://localhost:8081/WabiSabi/api/v4/btc';

type Tx = {
    vin: { isAddress: boolean; addresses: string[] }[];
    vout: { isAddress: boolean; addresses: string[] }[];
};

export class WabiSabiHttpClient extends EventEmitter {
    connection: any;

    constructor(options: Options) {
        super();
        console.log('WabiSabiHttpClient constructor', options);
        // console.log(typeof window);
        // console.log(typeof indexedDB);

        // if (typeof indexedDB !== 'undefined') {
        // }
        // indexedDB.open('MyTestDatabase', 1);
    }

    isConnected() {
        return true;
    }

    connect() {
        return false;
    }

    disconnect() {
        return false;
    }

    analyzeBlock(txs: Tx[], addresses: any[]) {
        return txs.map(tx => {
            const inputs = tx.vin.flatMap(out =>
                out.isAddress && Array.isArray(out.addresses) ? out.addresses : [],
            );
            const outputs = tx.vout.flatMap(out =>
                out.isAddress && Array.isArray(out.addresses) ? out.addresses : [],
            );
            console.warn('parse txs', inputs, outputs, addresses);
            const intersection = addresses.filter(
                addr => inputs.includes(addr) || outputs.includes(addr),
            );
            // const inters2 = addresses.filter(addr => outputs.includes(addr));

            return {
                tx,
                intersection,
            };
        });
    }

    async analyzeBlockFiters(params: any) {
        console.warn('Analyze', params.filters.length);
        const res: ReturnType<typeof search> = [];
        for (let i = 0; i < params.filters.length; i++) {
            const result = search(params.filters[i], params.addresses);
            if (result.length > 0) {
                res.push(...result);
            }
            console.warn('SEARCH RESULT', result);
        }
        const blocks = await Promise.all(
            res.map(r =>
                httpRequest<{ txs: any[] }>(
                    `/block/${r.blockHeight}`, // TODO: rawblock on new not released blockbook
                    {},
                    { method: 'GET', baseUrl: 'http://localhost:8081/blockbook/api/v2' },
                ),
            ),
        );
        const txs = blocks.map(bl => this.analyzeBlock(bl.txs, params.addresses));
        console.warn('BLOCKS!', blocks);
        console.warn('TXS!', txs);
        return Promise.resolve(res);
    }

    // http://localhost:8081/api/v4/btc/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=2&estimateSmartFeeMode=Conservative
    // http://localhost:8081/WabiSabi/api/v4/btc/Blockchain/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=10&estimateSmartFeeMode=Conservative
    // http://localhost:8081/WabiSabi/api/v4/btc/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=2&estimateSmartFeeMode=Conservative
    // http://localhost:8081/WabiSabi/api/v4/btc/Blockchain/Batch/synchronize?bestKnownBlockHash=0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206&maxNumberOfFilters=10&estimateSmartFeeMode=Conservative
    async getBlockFilters(params: any) {
        // Main: 0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893
        // TestNet: 00000000000f0d5edcaeba823db17f366be49a80d91d15b77747c2e017b8c20a
        // RegTest: 0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206
        // return httpRequest<any>(
        //     '/Batch/synchronize',
        //     {
        //         bestKnownBlockHash:
        //             '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        //         maxNumberOfFilters: 10,
        //         estimateSmartFeeMode: 'Conservative',
        //     },
        //     { method: 'GET', baseUrl: 'http://localhost:8081/WabiSabi/api/v4/btc' },
        // );
        const response = await httpRequest<{ bestHeight: number; filters: string[] } | string>(
            '/Blockchain/filters',
            {
                bestKnownBlockHash: params.knownBlockHash,
                count: params.count,
            },
            { method: 'GET', baseUrl },
        ).catch(error => {
            throw error;
        });
        if (typeof response === 'string') {
            return [];
        }
        // console.warn("RESO")
        return response.filters.map(data => {
            const [blockHeight, blockHash, filter, prevHash, blockTime] = data.split(':');
            return {
                blockHeight: Number(blockHeight),
                blockHash,
                filter,
                prevHash,
                blockTime: Number(blockTime),
            };
        });
    }
    getServerInfo() {
        // return httpRequest<any>(
        //     '/api/v4/btc/Blockchain/status',
        //     {},
        //     { method: 'GET', baseUrl: 'http://localhost:8081/WabiSabi' },
        // );
        return httpRequest<any>(
            '/Batch/synchronize',
            {
                bestKnownBlockHash:
                    '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                maxNumberOfFilters: 0,
                estimateSmartFeeMode: 'Conservative',
            },
            // { method: 'GET', baseUrl: 'http://localhost:8081/WabiSabi/api/v4/btc' },
            { method: 'GET', baseUrl },
        );
    }
}
