import { State as TransactionsState } from '@wallet-reducers/transactionReducer';
import { NETWORKS } from '@wallet-config';
import * as reducerUtils from '../reducerUtils';
import * as fixtures from './fixtures/reducerUtils';
import { Account } from '@wallet-types';

// TODO: write utils for generating txs, discoveries and remove 700+ lines of transactions fixtures
describe('reducerUtils', () => {
    fixtures.getAccountTransactions.forEach(f => {
        it(`reducerUtils.getAccountTransactions${f.testName}`, () => {
            expect(
                reducerUtils.getAccountTransactions(
                    // @ts-ignore TODO: Missing isAddress on TransactionTarget coming from connect/blockbook?
                    f.transactions as TransactionsState['transactions'],
                    f.account as Account,
                ),
            ).toEqual(f.result);
        });
    });

    it('reducerUtils.getSelectedAccount', () => {
        const res = reducerUtils.getSelectedAccount([], undefined, undefined);
        expect(res).toBeNull();
    });

    it('reducerUtils.getSelectedNetwork', () => {
        const res = reducerUtils.getSelectedNetwork(NETWORKS, 'btc');
        if (res) {
            expect(res.name).toEqual('Bitcoin');
        } else {
            expect(res).toBeNull();
        }
        expect(reducerUtils.getSelectedNetwork(NETWORKS, 'doesntexist')).toBeNull();
    });

    fixtures.observeChanges.forEach(f => {
        it(`reducerUtils.observeChanges${f.testName}`, () => {
            // @ts-ignore
            expect(reducerUtils.observeChanges(f.prev, f.current, f.filter)).toEqual(f.result);
        });
    });

    it('reducerUtils.getAccountHash', () => {
        expect(reducerUtils.getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });

    fixtures.enhanceTransaction.forEach(f => {
        it('reducerUtils.enhanceTransaction', () => {
            // @ts-ignore
            expect(reducerUtils.enhanceTransaction(f.tx, f.account)).toEqual(f.result);
        });
    });

    it('reducerUtils.getSelectedAccount', () => {
        expect(
            reducerUtils.getSelectedAccount(
                [
                    global.JestMocks.getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    global.JestMocks.getWalletAccount({
                        symbol: 'btc',
                        descriptor: '123',
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                global.JestMocks.getSuiteDevice({
                    state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                }),
                {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'normal',
                },
            ),
        ).toEqual(
            global.JestMocks.getWalletAccount({
                symbol: 'btc',
                descriptor: '123',
                accountType: 'normal',
                index: 1,
            }),
        );

        expect(
            reducerUtils.getSelectedAccount(
                [
                    global.JestMocks.getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    global.JestMocks.getWalletAccount({
                        symbol: 'btc',
                        descriptor: '123',
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                global.JestMocks.getSuiteDevice({
                    state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                }),
                undefined,
            ),
        ).toBeNull();

        expect(
            reducerUtils.getSelectedAccount(
                [
                    global.JestMocks.getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    global.JestMocks.getWalletAccount({
                        symbol: 'btc',
                        descriptor: '123',
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                undefined,
                {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'normal',
                },
            ),
        ).toBeNull();

        expect(
            reducerUtils.getSelectedAccount(
                [
                    global.JestMocks.getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    global.JestMocks.getWalletAccount({
                        symbol: 'btc',
                        descriptor: '123',
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                global.JestMocks.getSuiteDevice({
                    state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                }),
                {
                    symbol: 'btc',
                    accountIndex: 3,
                    accountType: 'normal',
                },
            ),
        ).toBeNull();
    });
});
