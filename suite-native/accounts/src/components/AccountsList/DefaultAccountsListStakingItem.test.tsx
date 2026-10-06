import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { DefaultAccountsListStakingItem } from './DefaultAccountsListStakingItem';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    CryptoToFiatAmountFormatter: () => null,
}));

describe('DefaultAccountsListStakingItem', () => {
    it('renders compact staking balance when fiat value is displayed', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

        const { getByText } = await renderWithBasicProvider(
            <DefaultAccountsListStakingItem
                account={account}
                stakingCryptoBalance="0.000004905501457726"
                onPress={jest.fn()}
            />,
        );

        expect(getByText('<0.00001 ETH')).toBeOnTheScreen();
    });
});
