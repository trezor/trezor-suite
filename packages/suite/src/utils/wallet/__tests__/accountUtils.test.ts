import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as accountUtils from '../accountUtils';

describe('account utils', () => {
    it('getSelectedAccount null', () => {
        const res = accountUtils.getSelectedAccount(undefined, [], undefined);
        expect(res).toBeNull();
    });

    it('getSelectedAccount', () => {
        expect(
            accountUtils.getSelectedAccount(
                '1stTestnetAddress@device_id:0',
                [
                    mockWalletAccount({
                        descriptor: asAccountDescriptor(
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        ),
                        symbol: 'btc',
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: 'btc',
                        descriptor: asAccountDescriptor('123'),
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
            mockWalletAccount({
                symbol: 'btc',
                descriptor: asAccountDescriptor('123'),
                accountType: 'normal',
                index: 1,
            }),
        );

        expect(
            accountUtils.getSelectedAccount(
                '1stTestnetAddress@device_id:0',
                [
                    mockWalletAccount({
                        descriptor: asAccountDescriptor(
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        ),
                        symbol: 'btc',
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: 'btc',
                        descriptor: asAccountDescriptor('123'),
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
                    mockWalletAccount({
                        descriptor: asAccountDescriptor(
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        ),
                        symbol: 'btc',
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: 'btc',
                        descriptor: asAccountDescriptor('123'),
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
                '1stTestnetAddress@device_id:0',
                [
                    mockWalletAccount({
                        descriptor: asAccountDescriptor(
                            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                        ),
                        symbol: 'btc',
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: 'btc',
                        descriptor: asAccountDescriptor('123'),
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

    describe('getAssetAccountRouteParams', () => {
        const normalAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('0xnormal'),
            accountType: 'normal',
            index: 0,
        });
        const importedAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('0ximported'),
            accountType: 'imported',
            index: 0,
        });

        it('prefers the default account of the network', () => {
            expect(
                accountUtils.getAssetAccountRouteParams([importedAccount, normalAccount], 'eth'),
            ).toEqual({ symbol: 'eth', accountIndex: 0, accountType: 'normal' });
        });

        it('falls back to the first account of the network when there is no default one', () => {
            expect(accountUtils.getAssetAccountRouteParams([importedAccount], 'eth')).toEqual({
                symbol: 'eth',
                accountIndex: 0,
                accountType: 'imported',
            });
        });

        it('ignores accounts of other networks', () => {
            expect(accountUtils.getAssetAccountRouteParams([importedAccount], 'btc')).toEqual({
                symbol: 'btc',
                accountIndex: 0,
                accountType: 'normal',
            });
        });
    });
});
