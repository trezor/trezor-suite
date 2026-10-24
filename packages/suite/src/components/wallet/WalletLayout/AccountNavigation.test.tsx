import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AccountNavigation } from './AccountNavigation';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

type TranslationMockProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationMockProps) => <span>{id}</span>,
}));

const BTC = asNetworkSymbol('btc');

// The coinjoin backend branch of Account carries its own sync status, which the mock cannot express.
const privacyAccount: Account = {
    ...mockWalletAccount({
        symbol: BTC,
        accountType: 'coinjoin',
        path: "m/10025'/0'/0'/1'",
    }),
    backendType: 'coinjoin',
    status: 'ready',
};

const getInitialState = (coordinatorUrl?: string): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [privacyAccount],
        selectedAccount: {
            status: 'loaded',
            account: privacyAccount,
            network: getNetwork(BTC),
            params: {
                symbol: BTC,
                accountIndex: privacyAccount.index,
                accountType: privacyAccount.accountType,
            },
        },
        coinjoin: {
            ...mockInitialAppState.wallet.coinjoin,
            debug: coordinatorUrl ? { coinjoinConfigOverride: { [BTC]: { coordinatorUrl } } } : {},
        },
    },
});

const renderAccountNavigation = (coordinatorUrl?: string) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        services: () => ({ analytics: mockDesktopAnalytics() }),
        preloadedState: getInitialState(coordinatorUrl),
    });

    renderWithProviders(services, <AccountNavigation account={privacyAccount} />);
};

describe('the account navigation of a Privacy account', () => {
    it('has no Mixing tab without a coordinator URL override', () => {
        renderAccountNavigation();

        expect(screen.queryByTestId('@wallet/menu/wallet-mixing')).not.toBeInTheDocument();
        expect(screen.getByTestId('@wallet/menu/wallet-overview')).toBeInTheDocument();
    });

    it('shows the Mixing tab while a coordinator URL override is present', () => {
        // The remote kill switch on top of the override is covered in coinjoinSelectors.test.ts.
        renderAccountNavigation('https://my-coordinator.example/wabisabi/');

        expect(screen.getByTestId('@wallet/menu/wallet-mixing')).toBeInTheDocument();
    });
});
