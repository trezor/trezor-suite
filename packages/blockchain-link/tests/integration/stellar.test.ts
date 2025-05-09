import { Horizon, Keypair } from '@stellar/stellar-sdk';

import { toStroops } from '@trezor/blockchain-link-utils/src/stellar';
import * as utils from '@trezor/blockchain-link-utils/src/stellar';

import BlockchainLink from '../../src';
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
        const latestTx = (
            await horizonServer.transactions().order('desc').limit(200).includeFailed(false).call()
        ).records.find(tx => !tx.fee_bump_transaction);
        if (!latestTx) {
            // This error may be thrown with a small probability and can be resolved by retrying.
            // For simplicity, no extensive design is implemented here.
            throw new Error('No transactions found');
        }
        const xdr = Buffer.from(latestTx.envelope_xdr, 'base64').toString('hex');
        const result = await blockchain.pushTransaction(xdr);
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
        const expectedReverse = '15000000';
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
            utils.transformTransaction(record, descriptor),
        );

        const result = await blockchain.getAccountInfo({
            descriptor,
            details: 'txs',
            pageSize,
        });
        const expectedBalance = toStroops(
            accountRawResp.balances[accountRawResp.balances.length - 1].balance,
        );
        const expectedReverse = '15000000';
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
        });
    });

    afterAll(() => {
        blockchain.dispose();
    });
});
