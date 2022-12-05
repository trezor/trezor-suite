import { networks } from '@trezor/utxo-lib';

import { analyzeTransactions } from '../../src/client/analyzeTransactions';
import { createServer } from '../mocks/server';

let server: Awaited<ReturnType<typeof createServer>>;

// create simplified transaction
const generateTx = (vin: any[], vout: any[]) => {
    const r = (v: any) => ({
        addresses: [v.address],
        value: v.value,
        isAccountOwned: v.isAccountOwned,
    });

    return {
        details: {
            vin: vin.map(r),
            vout: vout.map(r),
        },
    } as any;
};

// dummy anonymity calculation, 1 point in anonymitySet for each occurrence in tx history
const calcAnonymity = (transactions: any[]) => {
    const anonymity: Record<string, number> = {};
    const calc = (vinvout: any) => {
        if (typeof anonymity[vinvout.address] === 'number') {
            anonymity[vinvout.address] += 1;
        } else {
            anonymity[vinvout.address] = 1;
        }
    };
    transactions.forEach((tx: any) => {
        tx.internalInputs.forEach(calc);
        tx.internalOutputs.forEach(calc);
    });

    return Object.keys(anonymity).map(address => ({ address, anonymitySet: anonymity[address] }));
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
                    results: calcAnonymity(data.transactions),
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
        ];

        const response = await analyzeTransactions(txHistory, {
            ...server?.requestOptions,
            network: networks.regtest,
        });
        expect(response).toMatchObject({
            bcrt1p9av3jgcyjkwlh6gevvdn95a6vzyfqz962ulm57fc9mjuptg0usls0qvqvk: 1,
            bcrt1pksq9t85p4lect9ra8frvsn3f358lpkwtmlcgcup8aqaxcvnr4ylqglgdfp: 2, // occurred twice => greater anonymity
        });
    });
});
