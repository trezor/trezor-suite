import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { AdaAccountsListStakingItem } from './AdaAccountsListStakingItem';

describe('AdaAccountsListStakingItem', () => {
    it('shows an informational status for a registered key without a pool', async () => {
        const ada = asNetworkSymbol('ada');
        const account = mockWalletAccount({ symbol: ada });
        const descriptor = mockStakingProductDescriptor({ networkSymbol: ada });
        const position = mockStakingPosition({
            productId: descriptor.id,
            warnings: [{ code: 'no-stake-pool' }],
        });

        await renderWithStoreProvider(
            <AdaAccountsListStakingItem
                account={account}
                stakingCryptoBalance="1"
                onPress={jest.fn()}
            />,
            {
                preloadedState: {
                    wallet: { accounts: [account] },
                    earn: {
                        staking: mockStakingState({
                            platform: 'mobile',
                            descriptors: [descriptor],
                            positions: { [account.key]: [position] },
                        }),
                    },
                },
            },
        );

        expect(screen.getByTestId('@accountList/item/stakingNoPool')).toBeOnTheScreen();
    });
});
