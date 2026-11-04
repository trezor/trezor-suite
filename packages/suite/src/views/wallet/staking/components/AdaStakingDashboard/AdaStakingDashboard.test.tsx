import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren, type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AdaStakingDashboard } from './AdaStakingDashboard';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

let mockHasPendingTx = false;
let mockHasPendingDelegation = false;

type MockApyCardProps = { apy?: number | null };

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAllTransactionsForAccountThunk: () => ({ type: 'test/fetchAllTransactionsForAccount' }),
    hasPendingStakeTypeTransaction: () => mockHasPendingTx,
    selectAccountStakeTransactions: () => (mockHasPendingDelegation ? [{ blockHeight: 0 }] : []),
}));
jest.mock('#src/components/dashboard', () => ({
    DashboardSection: ({ children }: PropsWithChildren) => children,
}));
jest.mock('../StakingDashboard/StakingDashboard', () => ({
    StakingDashboard: ({ dashboard }: { dashboard: ReactNode }) => dashboard,
}));
jest.mock('./CardanoNewProviderCard', () => ({ CardanoNewProviderCard: () => null }));
jest.mock('../StakingDashboard/components/ApyCard', () => ({
    ApyCard: ({ apy }: MockApyCardProps) => <span data-testid="apy">{apy}</span>,
}));
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

const renderAdaStakingDashboard = (hasPendingTx = false, hasPendingDelegation = false) => {
    mockHasPendingTx = hasPendingTx;
    mockHasPendingDelegation = hasPendingDelegation;
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [stakedAccountWithRewards],
                stake: {
                    ...mockInitialAppState.wallet.stake,
                    data: {
                        ...mockInitialAppState.wallet.stake.data,
                        data: {
                            ...mockInitialAppState.wallet.stake.data.data,
                            ada: {
                                pools: [
                                    {
                                        id: CARDANO_EVERSTAKE_STAKING_POOL.bech32,
                                        apy: 5,
                                        saturation: 0,
                                    },
                                ],
                            },
                        },
                    },
                },
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
    it('shows zero APY without a pool before updating the provider', () => {
        renderAdaStakingDashboard();

        expect(screen.getByTestId('apy')).toHaveTextContent('0');
    });

    it('shows the promoted provider APY while a provider update is pending', () => {
        renderAdaStakingDashboard(true, true);

        expect(screen.getByTestId('apy')).toHaveTextContent('5');
    });

    it('keeps zero APY while a non-delegation staking transaction is pending', () => {
        renderAdaStakingDashboard(true);
        expect(screen.getByTestId('apy')).toHaveTextContent('0');
    });

    // Recurring bug: https://github.com/trezor/trezor-suite/issues/32138
    it('shows no claim card for a staked account with rewards, as Cardano claims from the staking card', () => {
        renderAdaStakingDashboard();

        expect(screen.getByTestId('@wallet/staking/card')).toBeInTheDocument();
        expect(screen.queryByTestId('@staking/can-claim-card')).not.toBeInTheDocument();
    });
});
