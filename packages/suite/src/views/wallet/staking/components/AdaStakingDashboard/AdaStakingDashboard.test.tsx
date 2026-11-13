import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren, type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AdaStakingDashboard } from './AdaStakingDashboard';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAllTransactionsForAccountThunk: () => ({ type: 'test/fetchAllTransactionsForAccount' }),
}));
jest.mock('#src/components/dashboard', () => ({
    DashboardSection: ({ children }: PropsWithChildren) => children,
}));
jest.mock('../StakingDashboard/StakingDashboard', () => ({
    StakingDashboard: ({ dashboard }: { dashboard: ReactNode }) => dashboard,
}));
jest.mock('./CardanoNewProviderCard', () => ({ CardanoNewProviderCard: () => null }));
jest.mock('../StakingDashboard/components/ApyCard', () => ({ ApyCard: () => null }));
jest.mock('../StakingDashboard/components/DebugOnlyCardanoStakingCard', () => ({
    DebugOnlyCardanoStakingCard: () => null,
}));
jest.mock('../StakingDashboard/components/DiscoveryWarning', () => ({
    DiscoveryWarning: () => null,
}));
jest.mock('../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard', () => ({
    EmptyStakingCard: () => null,
}));
jest.mock('../StakingDashboard/components/PayoutCardFrequencyRewards', () => ({
    PayoutCardFrequencyRewards: () => null,
}));
jest.mock('../StakingDashboard/components/Transactions', () => ({ Transactions: () => null }));
jest.mock('../StakingDashboard/components/StakingCard', () => ({
    StakingCard: () => <div data-testid="@wallet/staking/card" />,
}));
jest.mock('../StakingDashboard/components/ClaimCard', () => ({
    ClaimCard: () => <div data-testid="@staking/can-claim-card" />,
}));

const stakedAccountWithRewards = mockWalletAccount(
    { symbol: asNetworkSymbol('ada') },
    { misc: { staking: { address: 'stake1_address', isActive: true, rewards: '56398' } } },
);

const renderAdaStakingDashboard = () => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [stakedAccountWithRewards],
            },
        },
    });
    const selectedAccount: SelectedAccountLoaded = {
        status: 'loaded',
        account: stakedAccountWithRewards,
        network: getNetwork(stakedAccountWithRewards.symbol),
        params: undefined,
    };

    renderWithProviders(services, <AdaStakingDashboard selectedAccount={selectedAccount} />);
};

describe('AdaStakingDashboard', () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/32138
    it('shows no claim card for a staked account with rewards, as Cardano claims from the staking card', () => {
        renderAdaStakingDashboard();

        expect(screen.getByTestId('@wallet/staking/card')).toBeInTheDocument();
        expect(screen.queryByTestId('@staking/can-claim-card')).not.toBeInTheDocument();
    });
});
