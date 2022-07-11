import createServer, { EnhancedServer } from '../websocket';
import WabiSabi from '../../src/workers/wabisabi';
import BlockchainLink from '../../src';

const BLOCKFILTERS: any[] = [];

[{ name: 'wabisabi', worker: WabiSabi }].forEach(instance => {
    describe(`getBlockFilters: ${instance.name}`, () => {
        let server: EnhancedServer;
        let blockchain: BlockchainLink;

        const setup = async () => {
            server = await createServer('blockbook');
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = async () => {
            await blockchain.disconnect();
            blockchain.dispose();
            await server.close();
        };
        beforeAll(setup);
        afterAll(teardown);

        it('ejj', async () => {
            // const response = await blockchain.getInfo();
            // console.warn('REST RESPONSE1', response);
            const request = (params: any) => blockchain.getBlockFilters(params);

            let complete = false;
            const COUNT = 10;
            //
            const par = {
                knownBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                // knownBlockHash: '6e9fdf3751990cddd67ebbc4146d5577ba3fa919b9bd33109cf324e1e30e3b99', // block 101
                count: COUNT,
            };
            while (!complete) {
                // eslint-disable-next-line no-await-in-loop
                const resp = await request(par);
                BLOCKFILTERS.push(...resp);
                if (resp.length > 0) {
                    const knownBlockHash = resp[resp.length - 1].blockHash;
                    par.knownBlockHash = knownBlockHash;
                } else {
                    complete = true;
                    break;
                }
            }

            console.warn('DB', BLOCKFILTERS);

            let complete2 = false;
            let dbIndex = 0;
            const BLOCKS_TO_FETCH: any[] = [];
            const SIZE = 50;
            while (!complete2) {
                const filters = BLOCKFILTERS.slice(dbIndex, dbIndex + SIZE);
                if (filters.length < 1) {
                    complete2 = true;
                    return;
                }
                dbIndex += SIZE;
                // eslint-disable-next-line no-await-in-loop
                const blocks = await blockchain.analyzeBlockFilters({
                    filters,
                    descriptor: 'a',
                    addresses: [
                        'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx',
                        'bcrt1q7gefpk0ehc738gc4kmltu20uq7rdxnyk7aupqg',
                        'n2uwaLQYxRRutG7LQvsATxAb5Ze4GeVfXC',
                    ],
                });
                if (blocks.length > 0) {
                    BLOCKS_TO_FETCH.push(...blocks);
                }

                console.log('FINAL LEN', dbIndex, blocks, filters);
                // complete2 = true;
            }

            expect(BLOCKS_TO_FETCH.length).toBe(2);

            console.warn('BLOCKS TO FETCH!', BLOCKS_TO_FETCH);

            // const response2 = await blockchain.getBlockFilters({
            //     knownBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            //     count: 5,
            // });
            // eslint-disable-next-line no-console
            // console.warn('REST RESPONSE2', response2);
        });

        // fixtures[instance.name].forEach(f => {
        //     it(f.description, async () => {
        //         server.setFixtures(f.serverFixtures);
        //         try {
        //             const response = await blockchain.getBlockHash(f.params);
        //             expect(response).toEqual(f.response);
        //         } catch (error) {
        //             expect(error.message).toEqual(f.error);
        //         }
        //     });
        // });
    });
});
