import { Horizon, Keypair } from '@stellar/stellar-sdk';

import { toStroops } from '@trezor/blockchain-link-utils/src/stellar';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';

import { BlockchainLink } from '../../src';
import StellarWorker from '../../src/workers/stellar';

const HORIZON_URL = 'https://horizon.stellar.org';

describe('Stellar', () => {
    let blockchain: BlockchainLink;
    let horizonServer: Horizon.Server;
    const worker = StellarWorker();

    beforeAll(() => {
        blockchain = new BlockchainLink({
            name: 'Stellar',
            worker: () => worker,
            server: [HORIZON_URL],
            debug: false,
        });
        horizonServer = new Horizon.Server(HORIZON_URL);
    });

    it('getInfo', async () => {
        const result = await blockchain.getInfo();
        expect(result).toEqual({
            testnet: false,
            blockHeight: expect.any(Number),
            blockHash: expect.any(String),
            shortcut: 'xlm',
            url: expect.any(String),
            name: 'Stellar',
            network: 'xlm',
            version: expect.any(String),
            decimals: 7,
        });
    });

    it('estimateFee', async () => {
        const result = await blockchain.estimateFee({});
        expect(result).toEqual([{ feePerUnit: expect.any(String) }]);
    });

    it('pushTransaction', async () => {
        // Stellar mainnet traffic is sometimes dominated by fee-bump transactions; paginate
        // until a non-fee-bump tx is found so the test doesn't flake when the first page is
        // all fee-bumps.
        const maxPages = 5;
        let page = await horizonServer
            .transactions()
            .order('desc')
            .limit(200)
            .includeFailed(false)
            .call();
        let latestTx = page.records.find(tx => !tx.fee_bump_transaction);
        for (let i = 1; !latestTx && i < maxPages; i++) {
            page = await page.next();
            if (!page.records.length) break;
            latestTx = page.records.find(tx => !tx.fee_bump_transaction);
        }
        if (!latestTx) {
            throw new Error(`No non-fee-bump transactions found in the last ${maxPages} pages`);
        }
        const xdr = Buffer.from(latestTx.envelope_xdr, 'base64').toString('hex');
        const result = await blockchain.pushTransaction({ hex: xdr });
        expect(result).toEqual(latestTx.hash);
    });

    it('getAccountInfo (Basic)', async () => {
        const descriptor = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
        const accountRawResp = await horizonServer.loadAccount(descriptor);

        const result = await blockchain.getAccountInfo({
            descriptor,
        });
        const expectedBalance = toStroops(
            accountRawResp.balances[accountRawResp.balances.length - 1].balance,
        );
        const expectedReverse = '20000000';
        const expectedAvailableBalance = expectedBalance.minus(expectedReverse).toString();
        expect(result).toEqual({
            availableBalance: expectedAvailableBalance,
            balance: expectedBalance.toString(),
            descriptor,
            empty: false,
            history: {
                total: -1,
                transactions: undefined,
                unconfirmed: 0,
            },
            misc: {
                reserve: expectedReverse,
                stellarSequence: accountRawResp.sequence,
            },
            tokens: [
                {
                    balance: '4052297',
                    contract: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                    decimals: 7,
                    name: 'USDC',
                    standard: 'STELLAR-CLASSIC',
                    symbol: 'USDC',
                },
            ],
        });
    });

    it('getAccountInfo (Empty Account)', async () => {
        const descriptor = Keypair.random().publicKey();

        const result = await blockchain.getAccountInfo({
            descriptor,
        });

        expect(result).toEqual({
            availableBalance: '0',
            balance: '0',
            descriptor,
            empty: true,
            history: {
                total: -1,
                transactions: undefined,
                unconfirmed: 0,
            },
            misc: {
                reserve: '10000000',
                stellarSequence: '0',
            },
        });
    });

    it('getAccountInfo (Transactions full)', async () => {
        const descriptor = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
        const accountRawResp = await horizonServer.loadAccount(descriptor);

        const pageSize = 25;

        const txRawResp = await horizonServer
            .transactions()
            .limit(pageSize)
            .forAccount(descriptor)
            .order('desc')
            .includeFailed(true)
            .call();

        const expectedCursor = txRawResp.records[txRawResp.records.length - 1].paging_token;
        const expectedTxs = txRawResp.records.map(record =>
            utils.transformTransaction(record, descriptor, {}),
        );

        const result = await blockchain.getAccountInfo({
            descriptor,
            details: 'txs',
            pageSize,
        });
        const expectedBalance = toStroops(
            accountRawResp.balances[accountRawResp.balances.length - 1].balance,
        );
        const expectedReverse = '20000000';
        const expectedAvailableBalance = expectedBalance.minus(expectedReverse).toString();
        expect(result).toEqual({
            availableBalance: expectedAvailableBalance,
            balance: expectedBalance.toString(),
            descriptor,
            empty: false,
            history: {
                total: -1,
                transactions: expectedTxs,
                unconfirmed: 0,
            },
            misc: {
                reserve: expectedReverse,
                stellarSequence: accountRawResp.sequence,
            },
            stellarCursor: expectedCursor,
            tokens: [
                {
                    balance: '4052297',
                    contract: 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                    decimals: 7,
                    name: 'USDC',
                    standard: 'STELLAR-CLASSIC',
                    symbol: 'USDC',
                },
            ],
        });
    });

    afterAll(() => {
        blockchain.dispose();
    });
});
