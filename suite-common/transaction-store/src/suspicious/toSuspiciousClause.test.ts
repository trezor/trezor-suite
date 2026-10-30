import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';

import { mockTransaction } from '../../mocks/mockTransaction';
import { testCreateTransactionStoreSqlite } from '../../mocks/testCreateTransactionStoreSqlite';
import {
    type TransactionsFilter,
    createTransactionRepository,
} from '../repository/createTransactionRepository';
import { migrateTransactionStoreSchema } from '../schema/migrateTransactionStoreSchema';
import type { SuspiciousTransactionsContext } from '../transactionStoreTypes';

const eth = asNetworkSymbol('eth');
const btc = asNetworkSymbol('btc');
const trx = asNetworkSymbol('trx');
const xlm = asNetworkSymbol('xlm');

const LEGIT = '0xlegit';
const FAKE = '0xfake';

const token = (contract: string, amount: string): Transaction['tokens'][number] => ({
    type: 'recv',
    standard: 'ERC20',
    amount,
    from: '0xthem',
    to: '0xme',
    contract,
    symbol: 'TKN',
    decimals: 18,
});

const hideSuspicious = (
    context: Partial<SuspiciousTransactionsContext> = {},
): SuspiciousTransactionsContext => ({ notScamTxids: [], flaggedTxids: [], ...context });

const setUp = async () => {
    const sqlite = await testCreateTransactionStoreSqlite();
    migrateTransactionStoreSchema({ sqlite });
    const repository = createTransactionRepository({ sqlite });
    repository.replaceAccounts([
        { accountKey: 'eth', symbol: eth, descriptor: '0xme' },
        { accountKey: 'btc', symbol: btc, descriptor: 'xpub' },
        { accountKey: 'trx', symbol: trx, descriptor: 'Tme' },
        { accountKey: 'xlm', symbol: xlm, descriptor: 'Gme' },
    ]);
    const store = (accountKey: string, transactions: Transaction[]) =>
        repository.upsertTransactions({ accountKey, transactions });
    // Sorted: the mocks share a block time, so the store orders them by txid anyway.
    const visibleTxids = (filter: TransactionsFilter) =>
        repository
            .selectTransactions(filter)
            .map(({ txid }) => txid)
            .sort();

    return { sqlite, repository, store, visibleTxids };
};

describe('hiding suspicious transactions', () => {
    it('hides a token-only transaction moving nothing, but never one the account sent', async () => {
        const { sqlite, store, visibleTxids } = await setUp();
        store('eth', [
            mockTransaction({ txid: 'airdrop', amount: '0', tokens: [token(FAKE, '0')] }),
            mockTransaction({
                txid: 'sent',
                type: 'sent',
                amount: '0',
                tokens: [token(FAKE, '0')],
            }),
            mockTransaction({ txid: 'coin', amount: '5' }),
        ]);

        expect(visibleTxids({ accountKeys: ['eth'] })).toEqual(['airdrop', 'coin', 'sent']);
        expect(visibleTxids({ accountKeys: ['eth'], hideSuspicious: hideSuspicious() })).toEqual([
            'coin',
            'sent',
        ]);
        sqlite.dispose();
    });

    it("hides unknown tokens once it has the network's definitions, matched as they list them", async () => {
        const { sqlite, repository, store, visibleTxids } = await setUp();
        store('eth', [
            mockTransaction({ txid: 'fake', amount: '0', tokens: [token(FAKE, '5')] }),
            mockTransaction({ txid: 'legit', amount: '0', tokens: [token('0xLEGIT', '5')] }),
        ]);
        const filter = { accountKeys: ['eth'], hideSuspicious: hideSuspicious() };

        expect(visibleTxids(filter)).toEqual(['fake', 'legit']);

        repository.replaceKnownTokens({ symbol: eth, coin: [LEGIT], nft: null });

        expect(visibleTxids(filter)).toEqual(['legit']);
        expect(repository.countTransactions(filter)).toBe(1);
        sqlite.dispose();
    });

    it('hides what the app flagged from what only it has, unless the user marked it', async () => {
        const { sqlite, store, visibleTxids } = await setUp();
        store('btc', [
            mockTransaction({ txid: 'dust', amount: '1' }),
            mockTransaction({ txid: 'real', amount: '100000' }),
        ]);
        store('eth', [
            mockTransaction({ txid: 'airdrop', amount: '0', tokens: [token(FAKE, '0')] }),
        ]);

        expect(
            visibleTxids({
                accountKeys: ['btc', 'eth'],
                hideSuspicious: hideSuspicious({
                    flaggedTxids: ['dust'],
                    notScamTxids: ['airdrop'],
                }),
            }),
        ).toEqual(['airdrop', 'real']);
        sqlite.dispose();
    });

    it("hides what a network's own detectors flag, and only there", async () => {
        const { sqlite, store, visibleTxids } = await setUp();
        store('trx', [
            mockTransaction({
                txid: 'trc10',
                tronSpecific: { contractType: 'TransferAssetContract' },
            }),
            mockTransaction({
                txid: 'trc20',
                tronSpecific: { contractType: 'TriggerSmartContract' },
            }),
        ]);
        store('xlm', [
            mockTransaction({ txid: 'undecoded', type: 'unknown', amount: '0' }),
            mockTransaction({ txid: 'payment' }),
        ]);
        store('btc', [mockTransaction({ txid: 'odd', type: 'unknown', amount: '0' })]);

        expect(
            visibleTxids({
                accountKeys: ['trx', 'xlm', 'btc'],
                hideSuspicious: hideSuspicious(),
            }),
        ).toEqual(['odd', 'payment', 'trc20']);
        sqlite.dispose();
    });
});
