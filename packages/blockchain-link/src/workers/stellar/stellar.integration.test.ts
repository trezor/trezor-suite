import * as utils from '@trezor/blockchain-link-utils/src/stellar';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    getStellarConnection,
    groupOperationsByTransaction,
    identifyTransaction,
    toStroops,
} from '@trezor/network-stellar';
import type { StellarAPI } from '@trezor/network-stellar/types';

import { BlockchainLink } from '../../index';

import StellarWorker from './index';

const HORIZON_URL = 'https://horizon.stellar.org';

describe('Stellar', () => {
    let blockchain: BlockchainLink;
    let horizonServer: StellarAPI;

    beforeAll(async () => {
        blockchain = new BlockchainLink({
            name: 'Stellar',
            worker: StellarWorker,
            server: [HORIZON_URL],
            debug: false,
        });
        const { api } = await getStellarConnection(HORIZON_URL);
        horizonServer = api;
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
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastBalance: (typeof accountRawResp.balances)[number] =
            accountRawResp.balances[accountRawResp.balances.length - 1];
        const expectedBalance = toStroops(lastBalance.balance);
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
                baseReserve: '5000000',
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
        const descriptor = 'GD22QZ5Q3X4PEDGYYN6HBPJL6DA6UE7X4WMPGPV5RNOKGK6DSYXFMOJC';
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
                baseReserve: '5000000',
                stellarSequence: '0',
            },
        });
    });

    it('getAccountInfo (Transactions full)', async () => {
        const descriptor = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
        const accountRawResp = await horizonServer.loadAccount(descriptor);

        const pageSize = 25;
        const limit = pageSize * 2;

        const opsRawResp = await horizonServer
            .operations()
            .forAccount(descriptor)
            .includeFailed(true)
            .join('transactions')
            .limit(limit)
            .order('desc')
            .call();

        const groups = groupOperationsByTransaction(
            opsRawResp.records,
            opsRawResp.records.length === limit,
        ).slice(0, pageSize);

        const expectedCursor = groups[groups.length - 1]?.cursor;
        const expectedTxs = await Promise.all(
            groups.map(async ({ operations }) =>
                utils.transformTransaction(
                    identifyTransaction(operations, await operations[0].transaction()),
                    descriptor,
                    {},
                ),
            ),
        );

        const result = await blockchain.getAccountInfo({
            descriptor,
            details: 'txs',
            pageSize,
        });
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastBalance2: (typeof accountRawResp.balances)[number] =
            accountRawResp.balances[accountRawResp.balances.length - 1];
        const expectedBalance = toStroops(lastBalance2.balance);
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
                baseReserve: '5000000',
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

    it('Horizon decodes Stellar Asset Contract transfers', async () => {
        // The account history depends on Horizon pre-decoding SAC transfers into
        // asset_balance_changes; the amounts are not recoverable from the envelope.
        const maxPages = 5;
        let page = await horizonServer.operations().order('desc').limit(200).call();
        let hostFunctionOp = page.records.find(record => 'asset_balance_changes' in record);
        for (let i = 1; !hostFunctionOp && i < maxPages; i++) {
            page = await page.next();
            if (!page.records.length) break;
            hostFunctionOp = page.records.find(record => 'asset_balance_changes' in record);
        }
        if (!hostFunctionOp) {
            throw new Error(`No host function operations found in the last ${maxPages} pages`);
        }

        expect(
            (hostFunctionOp as { asset_balance_changes: unknown }).asset_balance_changes,
        ).toBeInstanceOf(Array);
    });

    it('joins the transaction into the operations response', async () => {
        const descriptor = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
        const { records } = await horizonServer
            .operations()
            .forAccount(descriptor)
            .join('transactions')
            .limit(1)
            .order('desc')
            .call();

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const operation: (typeof records)[number] = records[0];
        const joinedTx = await operation.transaction();

        expect(joinedTx.hash).toBe(operation.transaction_hash);
    });

    afterAll(() => {
        blockchain.dispose();
    });
});
