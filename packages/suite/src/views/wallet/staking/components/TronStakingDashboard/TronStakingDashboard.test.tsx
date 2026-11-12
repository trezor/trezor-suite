import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { type SuiteSettingsRootState, suiteSettingsInitialState } from '@suite/settings';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TronStakingDashboard } from './TronStakingDashboard';

type TronDashboardTestState = AccountsRootState & TransactionsRootState & SuiteSettingsRootState;

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

type RenderTronStakingDashboardParams = {
    stakedBalance?: string;
    unclaimedReward?: string;
};

const renderTronStakingDashboard = ({
    stakedBalance = '0',
    unclaimedReward = '0',
}: RenderTronStakingDashboardParams = {}) => {
    const tronResources: TronAccountExtraData = {
        availableStakedBandwidth: 0,
        totalStakedBandwidth: 0,
        availableFreeBandwidth: 0,
        totalFreeBandwidth: 0,
        availableEnergy: 0,
        totalEnergy: 0,
        totalEnergyLimit: 0,
        totalEnergyWeight: 0,
        totalBandwidthLimit: 0,
        totalBandwidthWeight: 0,
        stakingInfo: {
            stakedBalance,
            stakedBalanceEnergy: stakedBalance,
            stakedBalanceBandwidth: '0',
            unstakingBatches: [],
            totalVotingPower: '0',
            availableVotingPower: '0',
            votes: [],
            unclaimedReward,
            latestWithdrawTime: 0,
            delegatedBalanceEnergy: '0',
            delegatedBalanceBandwidth: '0',
        },
    };
    const account = mockWalletAccount(
        { symbol: asNetworkSymbol('trx') },
        { misc: { tronResources } },
    );
    const { services } = createTestCompositionRoot<void, TronDashboardTestState>({
        preloadedState: {
            suiteSettings: suiteSettingsInitialState,
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
