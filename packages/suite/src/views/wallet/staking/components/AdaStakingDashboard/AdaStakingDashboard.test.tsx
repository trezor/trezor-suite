import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren, type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';

import { AdaStakingDashboard } from './AdaStakingDashboard';
import {
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
} from '../stakingDashboardTestState';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAllTransactionsForAccountThunk: () => ({ type: 'test/fetchAllTransactionsForAccount' }),
}));
jest.mock('#src/components/dashboard/DashboardSection', () => ({
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

const stakedPositionWithRewards = mockPosition(adaEverstakeProduct.id, {
    lockup: 'liquid',
    balances: {
        staked: amount('100056398'),
        pending: amount('0'),
        unstaking: amount('0'),
        withdrawable: amount('0'),
        rewards: amount('56398'),
    },
    operations: ['unstake', 'claim', 'vote'],
    details: { kind: 'cardano-delegation', poolId: null, drep: null },
});

const renderAdaStakingDashboard = () => {
    const selectedAccount: SelectedAccountLoaded = {
        status: 'loaded',
        account: adaAccount,
        network: getNetwork(adaAccount.symbol),
        params: undefined,
    };

    renderStakingDashboardComponent(<AdaStakingDashboard selectedAccount={selectedAccount} />, {
        state: createStakingDashboardState({
            accounts: [adaAccount],
            positions: { [adaAccount.key]: [stakedPositionWithRewards] },
        }),
    });
};

describe('AdaStakingDashboard', () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/32138
    it('shows no claim card for a staked account with rewards, as Cardano claims from the staking card', () => {
        renderAdaStakingDashboard();

        expect(screen.getByTestId('@wallet/staking/card')).toBeInTheDocument();
        expect(screen.queryByTestId('@staking/can-claim-card')).not.toBeInTheDocument();
    });
});
