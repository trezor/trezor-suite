import { networks } from '@trezor/utxo-lib';

import { analyzeTransactions } from './analyzeTransactions';
import { createServer } from '../../mocks/server';

let server: Awaited<ReturnType<typeof createServer>>;

// create simplified transaction
const generateTx = (vin: any[], vout: any[], type?: string) => {
    const mapVinVout = (v: any) => ({
        isAddress: typeof v.isAddress === 'boolean' ? v.isAddress : true,
        addresses: [v.address],
        value: v.value,
        isAccountOwned: v.isAccountOwned,
    });

    return {
        type,
        details: {
            vin: vin.map(mapVinVout),
            vout: vout.map(mapVinVout),
        },
    } as any;
};

// dummy anonymity calculation, 1 point in anonymitySet for each occurrence in tx history
const calcAnonymity = (transactions: any[]) => {
    const anonymity: Record<string, number> = {};
    const calc = (vinvout: any) => {
        const existing = anonymity[vinvout.Address];
        if (typeof existing === 'number') {
            anonymity[vinvout.Address] = existing + 1;
        } else {
            anonymity[vinvout.Address] = 1;
        }
    };
    transactions.forEach((tx: any) => {
        tx.InternalInputs.forEach(calc);
        tx.InternalOutputs.forEach(calc);
    });

    return Object.keys(anonymity).map(Address => ({ Address, AnonymitySet: anonymity[Address] }));
};

describe('analyzeTransactions', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('Regtest: simple analyze', async () => {
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/get-anonymity-scores')) {
                resolve({
                    Results: calcAnonymity(data.Transactions),
                });
            }
            resolve();
        });

        const txHistory = [
            generateTx(
                [
                    {
                        address: 'bcrt1p9av3jgcyjkwlh6gevvdn95a6vzyfqz962ulm57fc9mjuptg0usls0qvqvk',
                        value: 100,
                        isAccountOwned: true,
                    },
                    {
                        address: 'bcrt1ptxf8hxfzqgxr3fz3junehwu0fef80u5e8lw684fkka585kzne6ms6dv5zt',
                        value: 200,
                    },
                ],
                [
                    {
                        address: 'bcrt1pksq9t85p4lect9ra8frvsn3f358lpkwtmlcgcup8aqaxcvnr4ylqglgdfp',
                        value: 90,
                        isAccountOwned: true,
                    },
                    {
                        address: 'bcrt1pssj2qdyxm446ckkj2y22uu8l4wdtwjdqhtwk5uef0glazv69pfnsnza9gz',
                        value: 190,
                    },
                    // this output will be ignored
                    {
                        isAddress: false,
                        value: 0,
                        addresses: ['OP_RETURN (coinjoin)'],
                        hex: '636f696e6a6f696e',
                    },
                ],
            ),
            generateTx(
                [
                    {
                        address: 'bcrt1pksq9t85p4lect9ra8frvsn3f358lpkwtmlcgcup8aqaxcvnr4ylqglgdfp',
                        value: 90,
                        isAccountOwned: true,
                    },
                ],
                [
                    {
                        address: 'bcrt1pssj2qdyxm446ckkj2y22uu8l4wdtwjdqhtwk5uef0glazv69pfnsnza9gz',
                        value: 80,
                    },
                ],
            ),
            // The liquidity clue is derived from the most recent coinjoin in the history, so the
            // history needs one to exercise it at all.
            generateTx(
                [
                    {
                        address: 'bcrt1plc2ree0z9a9vew23updksagk2mvlwc2g3ft8zuj24l406dpqtlpqap8xz8',
                        value: 1030000,
                        isAccountOwned: true,
                    },
                ],
                [
                    {
                        address: 'bcrt1plc2ree0z9a9vew23updksagk2mvlwc2g3ft8zuj24l406dpqtlpqap8xz8',
                        value: 1000000,
                        isAccountOwned: true,
                    },
                    {
                        address: 'bcrt1p9ytmgr8evl2efv5eenxxz6tnppsmf3ekxsfwl8afpht7wnxrxdmq2yz4p0',
                        value: 20000,
                    },
                ],
                'joint',
            ),
        ];

        const response = await analyzeTransactions(txHistory, {
            ...server?.requestOptions,
            network: networks.regtest,
        });
        expect(response.anonymityScores).toMatchObject({
            bcrt1p9av3jgcyjkwlh6gevvdn95a6vzyfqz962ulm57fc9mjuptg0usls0qvqvk: 1,
            bcrt1pksq9t85p4lect9ra8frvsn3f358lpkwtmlcgcup8aqaxcvnr4ylqglgdfp: 2, // occurred twice => greater anonymity
        });
        // Computed locally from the coinjoin's outputs. The own 1000000 output still reaches the
        // clue and outweighs the foreign 20000; narrowing it to foreign outputs is a follow-up.
        expect(response.rawLiquidityClue).toBe(1000000);
    });
});
