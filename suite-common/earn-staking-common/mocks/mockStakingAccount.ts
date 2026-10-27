import { asNetworkSymbol } from '@trezor/network-module-types';

import type { StakingAccount } from '../src';

export const mockStakingAccount = (overrides: Partial<StakingAccount> = {}): StakingAccount => ({
    symbol: asNetworkSymbol('eth'),
    descriptor: '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8',
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    balance: '3000000000000000000',
    availableBalance: '3000000000000000000',
    misc: { nonce: '6' },
    ...overrides,
});
