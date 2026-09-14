import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import { getMerklRewardsQueryEntriesForAccounts } from './useGetMerklRewardsQueryEntries';

const networkConfigDeps = mockNetworkConfigDeps();

const emptyEthereumAccount = mockWalletAccount(
    {
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor('0xff6845f200000000000000000000000013fb4863'),
    },
    {
        ...networkSpecificDefaultEthereum,
        misc: { nonce: '0' },
    },
);

describe('getMerklRewardsQueryEntriesForAccounts', () => {
    it('allows callers to include empty EVM accounts when active positions are known', () => {
        expect(
            getMerklRewardsQueryEntriesForAccounts(networkConfigDeps, [emptyEthereumAccount]),
        ).toEqual([]);
        expect(
            getMerklRewardsQueryEntriesForAccounts(networkConfigDeps, [emptyEthereumAccount], {
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
