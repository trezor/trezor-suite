import { networks } from '@trezor/utxo-lib';

import { analyzeTransactions } from './analyzeTransactions';
import { createServer } from '../../mocks/server';
import type { Transaction } from '../types/backend';

let server: Awaited<ReturnType<typeof createServer>>;

// create simplified transaction
const generateTx = (vin: any[], vout: any[], type?: Transaction['type']) => {
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

// The real clue is computed by the middleware binary: it keeps only the amounts that are in
// upstream `BlockchainAnalyzer.StdDenoms`, dedupes them and averages the top ceil(n * 0.1),
// returning no clue when nothing survives the filter. This mock does not model that filter, so
// every foreign amount of a `joint` fixture transaction below must be a standard denomination
// (20000 and 500000 are); for a single one `take` is 1 and the result is that denomination, which
// is what this returns.
const calcLiquidityClue = (externalAmounts: number[]) =>
    externalAmounts.length > 0 ? Math.max(...externalAmounts) : null;

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
        let externalAmounts: number[] | undefined;
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/get-anonymity-scores')) {
                resolve({
                    Results: calcAnonymity(data.Transactions),
                });
            }
            if (url.endsWith('/init-liquidity-clue')) {
                externalAmounts = data.ExternalAmounts;
                resolve({ RawLiquidityClue: calcLiquidityClue(data.ExternalAmounts) });
            }
            resolve();
        });

        const txHistory = [
            // Production history arrives newest-first (`getAccountInfo` returns `txsFromLatest`),
            // so the liquidity clue is derived from this first `joint` transaction; the older
            // coinjoin at the end of the history must not contribute to it.
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
                    // the coinjoin marker will be ignored
                    {
                        isAddress: false,
                        value: 0,
                        addresses: ['OP_RETURN (coinjoin)'],
                        hex: '636f696e6a6f696e',
                    },
                ],
                'joint',
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
            // The oldest transaction is an earlier coinjoin. Its foreign output is a standard
            // denomination as well, so it would reach the clue if the newest coinjoin ever
            // stopped winning the selection.
            generateTx(
                [
                    {
                        address: 'bcrt1pg7ly7v4hslk70jutvtjf2za2twe0thfrqvf6e56njhp9sdlas8ksaal0j0',
                        value: 530000,
                        isAccountOwned: true,
                    },
                ],
                [
                    {
                        address: 'bcrt1pg7ly7v4hslk70jutvtjf2za2twe0thfrqvf6e56njhp9sdlas8ksaal0j0',
                        value: 500000,
                        isAccountOwned: true,
                    },
                    {
                        address: 'bcrt1pse2asqf9akr9apeqk6qvp84zexta65pp9whp8fzzjk6ukw7kdesqmztm27',
                        value: 500000,
                    },
                ],
                'joint',
            ),
        ];

        const response = await analyzeTransactions(txHistory, {
            ...server?.requestOptions,
            network: networks.regtest,
        });
        expect(response.anonymityScores).toEqual({
            bcrt1p9av3jgcyjkwlh6gevvdn95a6vzyfqz962ulm57fc9mjuptg0usls0qvqvk: 1,
            bcrt1pksq9t85p4lect9ra8frvsn3f358lpkwtmlcgcup8aqaxcvnr4ylqglgdfp: 2, // occurred twice => greater anonymity
            // the newest coinjoin: own input and own output on the same address
            bcrt1plc2ree0z9a9vew23updksagk2mvlwc2g3ft8zuj24l406dpqtlpqap8xz8: 2,
            // the oldest coinjoin: own input and own output on the same address
            bcrt1pg7ly7v4hslk70jutvtjf2za2twe0thfrqvf6e56njhp9sdlas8ksaal0j0: 2,
        });
        // The `!('address' in vout)` filter in `getRawLiquidityClue` never matches either shape
        // `transformVinVout` emits, so the account's own 1000000 coinjoin output reaches the clue
        // next to the foreign 20000 and, being the larger denomination, decides it. Only the
        // OP_RETURN marker is dropped, by `transformVinVout`. The 500000 of the older coinjoin is
        // absent because only the most recent coinjoin is the clue's source.
        expect(externalAmounts).toEqual([1000000, 20000]);
        expect(response.rawLiquidityClue).toBe(1000000);
    });
});
