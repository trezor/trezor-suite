import * as accountUtils from '../accountUtils';

describe('account utils', () => {
    it('getSelectedAccount null', () => {
        const res = accountUtils.getSelectedAccount(undefined, [], undefined);
        expect(res).toBeNull();
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

    it('hasNetworkFeatures', () => {
        const btcAcc = global.JestMocks.getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'btc',
        });

        const ethAcc = global.JestMocks.getWalletAccount();

        expect(accountUtils.hasNetworkFeatures(btcAcc, 'amount-unit')).toEqual(true);
        expect(accountUtils.hasNetworkFeatures(btcAcc, ['amount-unit', 'sign-verify'])).toEqual(
            true,
        );
        expect(accountUtils.hasNetworkFeatures(ethAcc, 'tokens')).toEqual(true);
        expect(accountUtils.hasNetworkFeatures(ethAcc, 'amount-unit')).toEqual(false);
        expect(accountUtils.hasNetworkFeatures(ethAcc, ['amount-unit', 'sign-verify'])).toEqual(
            false,
        );
    });
});
