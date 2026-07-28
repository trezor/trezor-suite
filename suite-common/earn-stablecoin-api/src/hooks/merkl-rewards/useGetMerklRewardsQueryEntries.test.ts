import { asAccountDescriptor } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import { getMerklRewardsQueryEntriesForAccounts } from './useGetMerklRewardsQueryEntries';

const emptyEthereumAccount = mockWalletAccount(
    {
        symbol: 'eth',
        descriptor: asAccountDescriptor('0xff6845f200000000000000000000000013fb4863'),
    },
    {
        ...networkSpecificDefaultEthereum,
        misc: { nonce: '0' },
    },
);

describe('getMerklRewardsQueryEntriesForAccounts', () => {
    it('allows callers to include empty EVM accounts when active positions are known', () => {
        expect(getMerklRewardsQueryEntriesForAccounts([emptyEthereumAccount])).toEqual([]);
        expect(
            getMerklRewardsQueryEntriesForAccounts([emptyEthereumAccount], {
                skipEmptyAccountCheck: true,
            }),
        ).toEqual([
            {
                chainId: 1,
                address: emptyEthereumAccount.descriptor,
            },
        ]);
    });
});
