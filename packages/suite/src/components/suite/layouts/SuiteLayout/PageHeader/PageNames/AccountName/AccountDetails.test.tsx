import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AccountDetails } from './AccountDetails';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../../mocks/mockInitialAppState';

jest.mock('@suite/labeling', () => ({
    Labeling: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const ETH = asNetworkSymbol('eth');

const ETH_ADDRESS = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';

const ethAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor(ETH_ADDRESS),
});

const renderDetails = (account: Account, isAddressShown = true) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            networks: mockNetworksState([account.symbol]),
            metadata: {
                ...mockInitialAppState.metadata,
                providers: [],
                selectedProvider: { labels: '', passwords: '' },
            },
            wallet: { ...mockInitialAppState.wallet, accounts: [account] },
        },
    });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <AccountDetails
            selectedAccount={account}
            isBalanceShown={false}
            isAddressShown={isAddressShown}
        />,
    );
};

describe('the account name in the header', () => {
    it('shows the shortened address of an address-based account below its name', () => {
        renderDetails(ethAccount);

        const address = screen
            .getByTestId('@wallet/account/address')
            .textContent?.replace(/\s/g, '');

        expect(address).toMatch(/^0x73d0.*\.\.\..*36A8$/);
    });

    it('leaves out the address when it is not asked for', () => {
        renderDetails(ethAccount, false);

        expect(screen.queryByTestId('@wallet/account/address')).not.toBeInTheDocument();
    });
});
