import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { DefaultAccountsListStakingItem } from './DefaultAccountsListStakingItem';

jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    CryptoToFiatAmountFormatter: () => null,
}));

describe('DefaultAccountsListStakingItem', () => {
    it('renders compact staking balance when fiat value is displayed', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

        const { getByText } = await renderWithStoreProvider(
            <DefaultAccountsListStakingItem
                account={account}
                stakingCryptoBalance="0.000004905501457726"
                onPress={jest.fn()}
            />,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('<0.00001 ETH')).toBeOnTheScreen();
    });
});
