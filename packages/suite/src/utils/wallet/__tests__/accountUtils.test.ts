import * as accountUtils from '../accountUtils';
import * as fixtures from '../__fixtures__/accountUtils';
import { Account } from '@wallet-types';

describe('account utils', () => {
    fixtures.getUtxoFromSignedTransaction.forEach(f => {
        it(`getUtxoFromSignedTransaction: ${f.description}`, () => {
            // @ts-ignore params are partial
            expect(accountUtils.getUtxoFromSignedTransaction(...f.params)).toMatchObject(f.result);
        });
    });

    fixtures.parseBIP44Path.forEach(f => {
        it('accountUtils.parseBIP44Path', () => {
            expect(accountUtils.parseBIP44Path(f.path)).toEqual(f.result);
        });
    });

    fixtures.sortByCoin.forEach(f => {
        it('accountUtils.sortByCoin', () => {
            expect(accountUtils.sortByCoin(f.accounts as Account[])).toEqual(f.result);
        });
    });

    describe('get title for network', () => {
        fixtures.accountTitleFixture.forEach((fixture: any) => {
            it(fixture.symbol, () => {
                expect(accountUtils.getTitleForNetwork(fixture.symbol)).toBe(fixture.title);
            });
        });
    });

    describe('getBip43Type', () => {
        fixtures.getBip43Type.forEach(f => {
            it(f.description, () => {
                // @ts-ignore intentional invalid params
                const bip43 = accountUtils.getBip43Type(f.path);
                expect(bip43).toBe(f.result);
            });
        });
    });

    it('get fiat value', () => {
        expect(accountUtils.getFiatValue('1', '10')).toEqual('10.00');
        expect(accountUtils.getFiatValue('1', '10', 5)).toEqual('10.00000');
        expect(accountUtils.getFiatValue('s', '10')).toEqual('');
    });

    it('format network amount', () => {
        expect(accountUtils.formatNetworkAmount('1', 'btc')).toEqual('0.00000001');
        expect(accountUtils.formatNetworkAmount('1', 'xrp')).toEqual('0.000001');
        expect(accountUtils.formatNetworkAmount('1', 'xrp', true)).toEqual('0.000001 XRP');
        expect(accountUtils.formatNetworkAmount('1', 'eth')).toEqual('0.000000000000000001');
        expect(accountUtils.formatNetworkAmount('1', 'btc', true)).toEqual('0.00000001 BTC');
        expect(accountUtils.formatNetworkAmount('aaa', 'eth')).toEqual('-1');
    });

    it('format amount to satoshi', () => {
        expect(accountUtils.networkAmountToSatoshi('0.00000001', 'btc')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000001', 'xrp')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000000000000000001', 'eth')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('aaa', 'eth')).toEqual('-1');
    });

    it('findAccountDevice', () => {
        expect(
            accountUtils.findAccountDevice(
                global.JestMocks.getWalletAccount({
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
                [
                    global.JestMocks.getSuiteDevice({
                        state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    }),
                    global.JestMocks.getSuiteDevice({
                        state: '20f91883604899768ba21ffd38d0f5f35b07f14e65355f342e4442547c0ce45e',
                    }),
                ],
            ),
        ).toEqual(
            global.JestMocks.getSuiteDevice({
                state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            }),
        );
    });

    fixtures.getAccountTransactions.forEach(f => {
        it(`getAccountTransactions${f.testName}`, () => {
            expect(
                accountUtils.getAccountTransactions(
                    // @ts-ignore TODO: Missing isAddress on TransactionTarget coming from connect/blockbook?
                    f.transactions as TransactionsState['transactions'],
                    f.account as Account,
                ),
            ).toEqual(f.result);
        });
    });

    it('getSelectedAccount null', () => {
        const res = accountUtils.getSelectedAccount(undefined, [], undefined);
        expect(res).toBeNull();
    });

    it('getSelectedNetwork', () => {
        const res = accountUtils.getNetwork('btc');
        if (res) {
            expect(res.name).toEqual('Bitcoin');
        } else {
            expect(res).toBeNull();
        }
        expect(accountUtils.getNetwork('doesntexist')).toBeNull();
    });

    it('getAccountHash', () => {
        expect(accountUtils.getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });

    it('getSelectedAccount', () => {
        expect(
            accountUtils.getSelectedAccount(
                '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
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
            accountUtils.getSelectedAccount(
                '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
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
            ),
        ).toBeNull();

        expect(
            accountUtils.getSelectedAccount(
                undefined,
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
                {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'normal',
                },
            ),
        ).toBeNull();

        expect(
            accountUtils.getSelectedAccount(
                '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
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
                {
                    symbol: 'btc',
                    accountIndex: 3,
                    accountType: 'normal',
                },
            ),
        ).toBeNull();
    });

    it('isTestnet', () => {
        expect(accountUtils.isTestnet('test')).toEqual(true);
        expect(accountUtils.isTestnet('trop')).toEqual(true);
        expect(accountUtils.isTestnet('txrp')).toEqual(true);
        expect(accountUtils.isTestnet('btc')).toEqual(false);
        expect(accountUtils.isTestnet('ltc')).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            accountUtils.getAccountIdentifier(
                global.JestMocks.getWalletAccount({
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
            ),
        ).toEqual({
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        });
    });

    it('accountSearchFn', () => {
        const btcAcc = global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            accountType: 'legacy',
            metadata: {
                key: 'xpub-foo-bar',
                fileName: '123',
                aesKey: 'foo',
                accountLabel: 'meow',
                outputLabels: {},
                addressLabels: {},
            },
        });

        expect(accountUtils.accountSearchFn(btcAcc, 'btc')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, '', 'btc')).toBe(true);
        expect(
            accountUtils.accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                'btc',
            ),
        ).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, '', 'ltc')).toBe(false);
        expect(accountUtils.accountSearchFn(btcAcc, 'bitcoin')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'legacy')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'bitco')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'ltc')).toBe(false);
        expect(accountUtils.accountSearchFn(btcAcc, 'litecoin')).toBe(false);
        expect(accountUtils.accountSearchFn(btcAcc, 'meow')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'meo')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'eow')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'MEOW')).toBe(true);
        expect(accountUtils.accountSearchFn(btcAcc, 'wuff')).toBe(false);
        expect(
            accountUtils.accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
        ).toBe(true);
    });
});
