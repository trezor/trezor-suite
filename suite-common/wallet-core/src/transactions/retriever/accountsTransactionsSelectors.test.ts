import {
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';

import {
    isAccountsTransactionsPageReady,
    selectAccountsTransactions,
} from './accountsTransactionsSelectors';
import { transactionsInitialState } from '../transactionsReducer';

describe(selectAccountsTransactions.name, () => {
    const FIRST = 'first-btc-device' as AccountKey;
    const SECOND = 'second-btc-device' as AccountKey;
    const COINJOIN = 'coinjoin-btc-device' as AccountKey;
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

    const transaction = (
        txid: string,
        blockHeight: number,
        tokenContracts: string[] = [],
        symbol = 'eth',
    ) =>
        ({
            txid,
            blockHeight,
            symbol,
            tokens: tokenContracts.map(contract => ({ contract })),
        }) as unknown as WalletAccountTransaction;

    type StateWithParams = {
        transactions: Record<AccountKey, (WalletAccountTransaction | undefined)[]>;
        loadedAccountKeys?: AccountKey[];
    };

    const stateWith = ({ transactions, loadedAccountKeys = [] }: StateWithParams) =>
        ({
            tokenDefinitions: {},
            wallet: {
                accounts: [
                    ...[FIRST, SECOND].map(key => ({ key, symbol: 'btc' })),
                    { key: COINJOIN, symbol: 'btc', backendType: 'coinjoin' },
                ],
                transactions: {
                    ...transactionsInitialState,
                    transactions,
                    fetchStatusDetail: Object.fromEntries(
                        loadedAccountKeys.map(key => [
                            key,
                            { status: 'idle', error: null, areAllTransactionsLoaded: true },
                        ]),
                    ),
                },
                settings: { suspiciousTransactionsFilter: {} },
                fiat: { historic: {} },
                phishing: { dustPhishing: { isEnabled: false } },
            },
        }) as unknown as Parameters<typeof selectAccountsTransactions>[0];

    const txids = (
        state: Parameters<typeof selectAccountsTransactions>[0],
        ...args: [AccountKey[], TokenAddress?]
    ) => selectAccountsTransactions(state, ...args).transactions.map(({ txid }) => txid);

    it('merges loaded accounts newest first, with pending ones on top', () => {
        const state = stateWith({
            transactions: {
                [FIRST]: [transaction('a', 100), transaction('c', 300)],
                [SECOND]: [transaction('b', 200), transaction('pending', 0)],
            },
            loadedAccountKeys: [FIRST, SECOND],
        });

        expect(txids(state, [FIRST, SECOND])).toEqual(['pending', 'c', 'b', 'a']);
    });

    it('lists only what an account still loading cannot outdate', () => {
        const state = stateWith({
            transactions: {
                [FIRST]: [transaction('a3', 300), transaction('a1', 100)],
                [SECOND]: [transaction('b4', 400), transaction('b2', 200)],
            },
            loadedAccountKeys: [FIRST],
        });

        expect(txids(state, [FIRST, SECOND])).toEqual(['b4', 'a3']);
        expect(selectAccountsTransactions(state, [FIRST, SECOND]).isComplete).toBe(false);
    });

    it('holds back a block an account still loading may continue on its next page', () => {
        const state = stateWith({
            transactions: {
                [FIRST]: [transaction('a2', 200), transaction('a1', 150)],
                [SECOND]: [transaction('b1', 150)],
            },
            loadedAccountKeys: [SECOND],
        });

        expect(txids(state, [FIRST, SECOND])).toEqual(['a2']);
    });

    it('stops an account still loading at its first page that was not fetched', () => {
        const transactions = [transaction('newest', 300), transaction('newer', 200)];
        transactions[3] = transaction('old', 100);

        expect(txids(stateWith({ transactions: { [FIRST]: transactions } }), [FIRST])).toEqual([
            'newest',
        ]);
    });

    it('keeps for a token only its transfers, also after a gap', () => {
        const transactions = [
            transaction('usdc', 300, [USDC.toUpperCase()]),
            transaction('eth', 200),
        ];
        transactions[3] = transaction('old usdc', 100, [USDC]);

        expect(
            txids(
                stateWith({ transactions: { [FIRST]: transactions }, loadedAccountKeys: [FIRST] }),
                [FIRST],
                USDC,
            ),
        ).toEqual(['usdc', 'old usdc']);
    });

    it('counts an account as loaded only once its history walk reached the end', () => {
        const transactions = { [FIRST]: [transaction('b', 200), transaction('a', 100)] };

        expect(selectAccountsTransactions(stateWith({ transactions }), [FIRST]).isComplete).toBe(
            false,
        );
        expect(
            selectAccountsTransactions(stateWith({ transactions, loadedAccountKeys: [FIRST] }), [
                FIRST,
            ]).isComplete,
        ).toBe(true);
    });

    it('orders pending transactions of several accounts by their time', () => {
        const pendingAt = (txid: string, blockTime: number) =>
            ({ ...transaction(txid, 0), blockTime }) as WalletAccountTransaction;
        const state = stateWith({
            transactions: {
                [FIRST]: [pendingAt('yesterday', 1_700_000_000)],
                [SECOND]: [pendingAt('today', 1_700_086_400)],
            },
            loadedAccountKeys: [FIRST, SECOND],
        });

        expect(txids(state, [FIRST, SECOND])).toEqual(['today', 'yesterday']);
    });

    it('tells Stellar assets apart by the case of their code', () => {
        const ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const state = stateWith({
            transactions: {
                [FIRST]: [
                    transaction('upper', 200, [`USD-${ISSUER}`], 'xlm'),
                    transaction('lower', 100, [`usd-${ISSUER}`], 'xlm'),
                ],
            },
            loadedAccountKeys: [FIRST],
        });

        expect(txids(state, [FIRST], `USD-${ISSUER}` as TokenAddress)).toEqual(['upper']);
    });

    it('counts the history a coinjoin scanner keeps as loaded', () => {
        const state = stateWith({
            transactions: { [COINJOIN]: [transaction('b', 200), transaction('a', 100)] },
        });

        expect(txids(state, [COINJOIN])).toEqual(['b', 'a']);
        expect(selectAccountsTransactions(state, [COINJOIN]).isComplete).toBe(true);
    });

    it('does not wait on an account that is gone', () => {
        const GONE = 'gone-btc-device' as AccountKey;

        expect(selectAccountsTransactions(stateWith({ transactions: {} }), [GONE]).isComplete).toBe(
            true,
        );
    });

    it('is ready once the page is full or history ended', () => {
        const loading = selectAccountsTransactions(
            stateWith({
                transactions: {
                    [FIRST]: [transaction('c', 300), transaction('b', 200), transaction('a', 100)],
                },
            }),
            [FIRST],
        );

        expect(
            isAccountsTransactionsPageReady({ accountsTransactions: loading, page: 1, perPage: 2 }),
        ).toBe(true);
        expect(
            isAccountsTransactionsPageReady({ accountsTransactions: loading, page: 2, perPage: 2 }),
        ).toBe(false);
        expect(
            isAccountsTransactionsPageReady({
                accountsTransactions: selectAccountsTransactions(
                    stateWith({ transactions: {} }),
                    [],
                ),
                page: 2,
                perPage: 2,
            }),
        ).toBe(true);
    });
});
