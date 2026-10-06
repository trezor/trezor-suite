import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as accountUtils from './accountUtils';

const btcSymbol = asNetworkSymbol('btc');

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
                        symbol: btcSymbol,
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: btcSymbol,
                        descriptor: asAccountDescriptor('123'),
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                {
                    symbol: btcSymbol,
                    accountIndex: 1,
                    accountType: 'normal',
                },
            ),
        ).toEqual(
            mockWalletAccount({
                symbol: btcSymbol,
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
                        symbol: btcSymbol,
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: btcSymbol,
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
                        symbol: btcSymbol,
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: btcSymbol,
                        descriptor: asAccountDescriptor('123'),
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                {
                    symbol: btcSymbol,
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
                        symbol: btcSymbol,
                        index: 0,
                    }),
                    mockWalletAccount({
                        symbol: btcSymbol,
                        descriptor: asAccountDescriptor('123'),
                        accountType: 'normal',
                        index: 1,
                    }),
                ],
                {
                    symbol: btcSymbol,
                    accountIndex: 3,
                    accountType: 'normal',
                },
            ),
        ).toBeNull();
    });
});
