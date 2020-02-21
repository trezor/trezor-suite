import * as accountUtils from '../accountUtils';
import * as fixtures from '../__fixtures__/accountUtils';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';

describe('account utils', () => {
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
                const title = accountUtils.getTitleForNetwork(fixture.symbol);
                expect(title.defaultMessage).toBe(fixture.title);
            });
        });
    });

    describe('get type for network', () => {
        fixtures.accountTypeFixture.forEach((fixture: any) => {
            it(fixture.networkType, () => {
                const title = accountUtils.getTypeForNetwork(fixture.networkType);
                expect(title ? title.defaultMessage : null).toBe(fixture.title);
            });
        });
    });

    describe('getBip43Shortcut', () => {
        fixtures.getBip43Shortcut.forEach(f => {
            it(f.description, () => {
                // @ts-ignore intentional invalid params
                const bip43 = accountUtils.getBip43Shortcut(f.path);
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
        expect(accountUtils.formatNetworkAmount('1', 'eth')).toEqual('0.000000000000000001');
        expect(accountUtils.formatNetworkAmount('aaa', 'eth')).toEqual('-1');
    });

    it('format amount to satoshi', () => {
        expect(accountUtils.networkAmountToSatoshi('0.00000001', 'btc')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000001', 'xrp')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000000000000000001', 'eth')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('aaa', 'eth')).toEqual('-1');
    });

    it('getAccountDevice', () => {
        expect(
            accountUtils.getAccountDevice(
                [
                    global.JestMocks.getSuiteDevice({
                        state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    }),
                    global.JestMocks.getSuiteDevice({
                        state: '20f91883604899768ba21ffd38d0f5f35b07f14e65355f342e4442547c0ce45e',
                    }),
                ],
                global.JestMocks.getWalletAccount({
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
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
        const res = accountUtils.getSelectedNetwork(NETWORKS, 'btc');
        if (res) {
            expect(res.name).toEqual('Bitcoin');
        } else {
            expect(res).toBeNull();
        }
        expect(accountUtils.getSelectedNetwork(NETWORKS, 'doesntexist')).toBeNull();
    });

    it('getAccountHash', () => {
        expect(accountUtils.getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });

    fixtures.enhanceTransaction.forEach(f => {
        it('enhanceTransaction', () => {
            // @ts-ignore
            expect(accountUtils.enhanceTransaction(f.tx, f.account)).toEqual(f.result);
        });
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
});
