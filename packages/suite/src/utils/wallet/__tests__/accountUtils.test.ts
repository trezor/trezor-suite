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
});
