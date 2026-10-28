import { asNetworkSymbol } from '@suite-common/wallet-config';

import { parseTransactionSearch } from './parseTransactionSearch';
import type { TransactionSearchTextMatches } from './transactionSearch';
import { mockTransaction } from '../../mocks/mockTransaction';
import { testCreateTransactionStoreSqlite } from '../../mocks/testCreateTransactionStoreSqlite';
import { createTransactionRepository } from '../repository/createTransactionRepository';
import { migrateTransactionStoreSchema } from '../schema/migrateTransactionStoreSchema';

const noMatches = (): TransactionSearchTextMatches => ({
    labelTxids: [],
    labelAddresses: [],
    isNativeSymbol: false,
});

const DAY = 24 * 60 * 60;
const OCT_1 = Date.parse('2026-10-01T00:00:00Z') / 1000;

/** A BTC account with three transactions, searched through the repository as the store does. */
const setUp = async () => {
    const sqlite = await testCreateTransactionStoreSqlite();
    migrateTransactionStoreSchema({ sqlite });
    const repository = createTransactionRepository({ sqlite });
    repository.upsertAccounts([
        { accountKey: 'btc', symbol: asNetworkSymbol('btc'), descriptor: 'xpub' },
    ]);
    repository.upsertTransactions({
        accountKey: 'btc',
        transactions: [
            mockTransaction({
                txid: 'aaa111',
                type: 'recv',
                amount: '150000000', // 1.5 BTC
                blockTime: OCT_1 + 100,
                details: {
                    vin: [{ n: 0, isAddress: true, addresses: ['bc1qsender'], value: '0' }],
                    vout: [],
                    size: 1,
                    totalInput: '0',
                    totalOutput: '0',
                },
            }),
            mockTransaction({
                txid: 'bbb222',
                type: 'sent',
                amount: '50000000', // 0.5 BTC, sent
                blockTime: OCT_1 + 2 * DAY,
            }),
            mockTransaction({
                txid: 'ccc333',
                type: 'recv',
                amount: '0',
                blockTime: OCT_1 + 3 * DAY,
                tokens: [
                    {
                        type: 'recv',
                        amount: '1000000',
                        from: '0xfrom',
                        to: '0xto',
                        contract: '0xusdc',
                        symbol: 'USDC',
                        decimals: 6,
                    },
                ],
            }),
        ],
    });

    const search = (
        query: string,
        resolveText: (text: string) => TransactionSearchTextMatches = noMatches,
    ) => {
        const parsed = parseTransactionSearch(query, resolveText);

        return repository
            .selectTransactions({ accountKeys: ['btc'], search: parsed ?? undefined })
            .map(({ txid }) => txid)
            .sort();
    };

    return { sqlite, search };
};

describe('searching stored transactions', () => {
    it('finds by txid, UTXO address, token symbol and amount digits', async () => {
        const { sqlite, search } = await setUp();

        expect(search('BBB')).toEqual(['bbb222']);
        expect(search('sender')).toEqual(['aaa111']);
        expect(search('usdc')).toEqual(['ccc333']);
        expect(search('1.5')).toEqual(['aaa111']);
        sqlite.dispose();
    });

    it('compares amounts in units, a sent one as negative', async () => {
        const { sqlite, search } = await setUp();

        expect(search('>1')).toEqual(['aaa111', 'ccc333']);
        expect(search('<0')).toEqual(['bbb222']);
        expect(search('=1.5')).toEqual(['aaa111']);
        sqlite.dispose();
    });

    it('compares dates with the block time', async () => {
        const { sqlite, search } = await setUp();

        expect(search('2026-10-01')).toEqual(['aaa111']);
        // As Redux's search: after the day's start, so the day itself counts.
        expect(search('>2026-10-02')).toEqual(['bbb222', 'ccc333']);
        expect(search('<2026-10-02')).toEqual(['aaa111']);
        sqlite.dispose();
    });

    it('joins terms with & and |', async () => {
        const { sqlite, search } = await setUp();

        expect(search('>2026-09-30 & <0')).toEqual(['bbb222']);
        expect(search('sender | usdc')).toEqual(['aaa111', 'ccc333']);
        sqlite.dispose();
    });

    it('matches what the app resolved: labels and the native symbol', async () => {
        const { sqlite, search } = await setUp();

        expect(search('salary', () => ({ ...noMatches(), labelTxids: ['bbb222'] }))).toEqual([
            'bbb222',
        ]);
        expect(search('mum', () => ({ ...noMatches(), labelAddresses: ['bc1qsender'] }))).toEqual([
            'aaa111',
        ]);
        expect(search('btc', () => ({ ...noMatches(), isNativeSymbol: true }))).toEqual([
            'aaa111',
            'bbb222',
        ]);
        sqlite.dispose();
    });

    it('matches nothing for an operator before something not a date or amount', async () => {
        const { sqlite, search } = await setUp();

        expect(search('>abc')).toEqual([]);
        sqlite.dispose();
    });

    it('is no search at all when the query constrains nothing', () => {
        expect(parseTransactionSearch('', noMatches)).toBeNull();
        expect(parseTransactionSearch('  & | >', noMatches)).toBeNull();
        expect(parseTransactionSearch('a |', noMatches)).toEqual([
            [{ type: 'text', text: 'a', ...noMatches() }],
        ]);
    });
});
