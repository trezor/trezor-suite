import { testMocks } from '@suite-common/test-utils';

import * as accountUtils from '../accountUtils';

const { getWalletAccount } = testMocks;

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
                    getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    getWalletAccount({
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
            getWalletAccount({
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
                    getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    getWalletAccount({
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
                    getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    getWalletAccount({
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
                    getWalletAccount({
                        descriptor:
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        symbol: 'btc',
                        index: 0,
                    }),
                    getWalletAccount({
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
});
