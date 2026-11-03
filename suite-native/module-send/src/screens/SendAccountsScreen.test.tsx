import { type ReactNode } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    RootStackRoutes,
    type SendStackParamList,
    SendStackRoutes,
} from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SendAccountsScreen } from './SendAccountsScreen';

const mockNavigate = jest.fn();
const mockAccountsListWithFilter = jest.fn();
const mockTokenContract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const mockNetworkSymbol = asNetworkSymbol('eth');
const account: Account = mockWalletAccount({
    symbol: mockNetworkSymbol,
    descriptor: asAccountDescriptor('ethdefault'),
});

let mockRouteParams: SendStackParamList[SendStackRoutes.SendAccounts];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
    useRoute: () => ({ params: mockRouteParams }),
}));

// Screen reads banner state the light store does not carry; the chrome is not under test.
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children }: { children: ReactNode }) => children,
}));

// The list itself is covered by its own selector tests; here it only has to hand back the
// props it was given and the account the user picked.
jest.mock('@suite-native/accounts', () => ({
    AccountsListWithFilter: (props: object) => {
        mockAccountsListWithFilter(props);

        return null;
    },
}));

const selectAccount = (hasAnyKnownTokens: boolean) => {
    const { onSelectAccount } = mockAccountsListWithFilter.mock.calls[0][0];

    onSelectAccount({ account, hasAnyKnownTokens });
};

const renderScreen = () =>
    renderWithStoreProvider(<SendAccountsScreen />, {
        services: { analytics: mockNativeAnalytics() },
    });

describe('SendAccountsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = undefined;
    });

    it('asks which asset to send once the account holds tokens', async () => {
        await renderScreen();

        selectAccount(true);

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AccountOverview, {
            accountKey: account.key,
            flowType: 'send',
        });
    });

    it('skips the asset question once the asset is already prefiltered', async () => {
        mockRouteParams = {
            asset: { networkSymbol: mockNetworkSymbol, tokenContract: mockTokenContract },
        };

        await renderScreen();

        selectAccount(true);

        expect(mockNavigate).toHaveBeenCalledWith(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: mockTokenContract,
        });
    });

    it('narrows the account list to the prefiltered asset', async () => {
        mockRouteParams = {
            asset: { networkSymbol: mockNetworkSymbol, tokenContract: mockTokenContract },
        };

        await renderScreen();

        expect(mockAccountsListWithFilter).toHaveBeenCalledWith(
            expect.objectContaining({
                networksFilter: [mockNetworkSymbol],
                tokenContract: mockTokenContract,
                hideNetworkFilter: true,
            }),
        );
    });

    it('preselects a native asset without a token contract', async () => {
        mockRouteParams = { asset: { networkSymbol: mockNetworkSymbol } };

        await renderScreen();

        selectAccount(true);

        expect(mockNavigate).toHaveBeenCalledWith(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: undefined,
        });
        expect(mockAccountsListWithFilter).toHaveBeenCalledWith(
            expect.objectContaining({
                networksFilter: [mockNetworkSymbol],
                tokenContract: undefined,
                hideNetworkFilter: true,
            }),
        );
    });

    it('keeps network filtering available outside asset detail', async () => {
        await renderScreen();

        expect(mockAccountsListWithFilter).toHaveBeenCalledWith(
            expect.objectContaining({ hideNetworkFilter: false }),
        );
    });
});
