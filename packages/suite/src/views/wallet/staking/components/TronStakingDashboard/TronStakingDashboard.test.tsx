import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { type SuiteSettingsRootState, suiteSettingsInitialState } from '@suite/settings';
import { type StakingRootState } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TronStakingDashboard } from './TronStakingDashboard';

type TronDashboardTestState = StakingRootState &
    AccountsRootState &
    TransactionsRootState &
    SuiteSettingsRootState;

type DashboardProps = {
    dashboard: ReactNode;
};

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAllTransactionsForAccountThunk: () => ({ type: 'test/fetchAllTransactionsForAccount' }),
}));
jest.mock('../StakingDashboard/StakingDashboard', () => ({
    StakingDashboard: ({ dashboard }: DashboardProps) => dashboard,
}));
jest.mock('./TronVotingRewardsCard', () => ({
    TronVotingRewardsCard: () => <div data-testid="@staking/tron-rewards-card/container" />,
}));
jest.mock('./TronStakedCard', () => ({
    TronStakedCard: () => <div data-testid="@staking/tron-staked-card/container" />,
}));
jest.mock('./TronWithdrawReadyBanner', () => ({ TronWithdrawReadyBanner: () => null }));
jest.mock('./TronUnstakingCard/TronUnstakingCard', () => ({ TronUnstakingCard: () => null }));
jest.mock('./TronResourcesCard/TronResourcesCard', () => ({ TronResourcesCard: () => null }));
jest.mock('../StakingDashboard/components/Transactions', () => ({ Transactions: () => null }));
jest.mock('../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard', () => ({
    EmptyStakingCard: () => <div data-testid="@wallet/staking/empty-card" />,
}));

const networkSymbol = asNetworkSymbol('trx');
const descriptor = mockStakingProductDescriptor({ networkSymbol });
const zero = stakingAmountSchema.parse('0');

type RenderTronStakingDashboardParams = {
    stakedBalance?: string;
    unclaimedReward?: string;
    isClaimOnCooldown?: boolean;
};

const renderTronStakingDashboard = ({
    stakedBalance = '0',
    unclaimedReward = '0',
    isClaimOnCooldown = false,
}: RenderTronStakingDashboardParams = {}) => {
    const account = mockWalletAccount({ symbol: networkSymbol });
    const hasStake = stakedBalance !== '0';
    const hasUnclaimedReward = unclaimedReward !== '0';
    const positions =
        hasStake || hasUnclaimedReward
            ? [
                  mockStakingPosition({
                      productId: descriptor.id,
                      status: hasStake ? 'active' : 'inactive',
                      balances: {
                          staked: stakingAmountSchema.parse(stakedBalance),
                          pending: zero,
                          unstaking: zero,
                          withdrawable: zero,
                          rewards: stakingAmountSchema.parse(unclaimedReward),
                      },
                      unlocks: [],
                      targets: [],
                      operations: [
                          'stake',
                          ...(hasStake ? (['unstake'] as const) : []),
                          ...(hasUnclaimedReward && !isClaimOnCooldown ? (['claim'] as const) : []),
                      ],
                  }),
              ]
            : [];
    const { services } = createTestCompositionRoot<void, TronDashboardTestState>({
        preloadedState: {
            suiteSettings: suiteSettingsInitialState,
            earn: {
                staking: mockStakingState({
                    descriptors: [descriptor],
                    positions: { [account.key]: positions },
                }),
            },
            wallet: { accounts: [account], transactions: transactionsInitialState },
        },
    });
    const selectedAccount: SelectedAccountLoaded = {
        status: 'loaded',
        account,
        network: getNetwork(account.symbol),
        params: undefined,
    };

    renderWithProviders(services, <TronStakingDashboard selectedAccount={selectedAccount} />);
};

describe('TronStakingDashboard', () => {
    it('keeps rewards reachable after the whole unstaked balance was withdrawn', () => {
        renderTronStakingDashboard({ unclaimedReward: '2000000' });

        expect(screen.getByTestId('@staking/tron-rewards-card/container')).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/staking/empty-card')).not.toBeInTheDocument();
    });

    it('keeps even one sun of unclaimed rewards reachable without a stake', () => {
        renderTronStakingDashboard({ unclaimedReward: '1' });

        expect(screen.getByTestId('@staking/tron-rewards-card/container')).toBeInTheDocument();
    });

    it('keeps rewards reachable during the claim cooldown even with no stake', () => {
        renderTronStakingDashboard({ unclaimedReward: '2000000', isClaimOnCooldown: true });

        expect(screen.getByTestId('@staking/tron-rewards-card/container')).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/staking/empty-card')).not.toBeInTheDocument();
    });

    it('shows the empty state when no stake or unclaimed rewards remain', () => {
        renderTronStakingDashboard();

        expect(screen.getByTestId('@wallet/staking/empty-card')).toBeInTheDocument();
        expect(
            screen.queryByTestId('@staking/tron-rewards-card/container'),
        ).not.toBeInTheDocument();
    });

    it('keeps the existing dashboard for an active stake without rewards', () => {
        renderTronStakingDashboard({ stakedBalance: '1000000' });

        expect(screen.getByTestId('@staking/tron-staked-card/container')).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/staking/empty-card')).not.toBeInTheDocument();
    });
});
