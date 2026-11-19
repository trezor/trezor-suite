import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren, type ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { type StakingPosition } from '@suite-common/earn-staking-common';
import { mockStakingProductInfo } from '@suite-common/earn-staking-common/mocks';
import { getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';

import { AdaStakingDashboard } from './AdaStakingDashboard';
import {
    adaAccount,
    adaEverstakeProduct,
    adaFiveBinariesProduct,
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
jest.mock('../StakingDashboard/components/ApyCard', () => ({
    ApyCard: ({ apy }: { apy: number | null }) => (
        <div data-testid="@staking/apy-card">{apy === null ? 'none' : apy}</div>
    ),
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

const EVERSTAKE_POOL_ID = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';
const OUTSIDE_POOL_ID = 'pool1outside';

const EVERSTAKE_RATE = 3.2;

const delegatedTo = (poolId: string, product = adaEverstakeProduct): StakingPosition =>
    mockPosition(product.id, {
        ...stakedPositionWithRewards,
        productId: product.id,
        targets: [{ address: poolId, providerId: product.providerId, amount: amount('100056398') }],
        details: { kind: 'cardano-delegation', poolId, drep: null },
    });

const renderAdaStakingDashboard = (position: StakingPosition = stakedPositionWithRewards) => {
    const selectedAccount: SelectedAccountLoaded = {
        status: 'loaded',
        account: adaAccount,
        network: getNetwork(adaAccount.symbol),
        params: undefined,
    };

    renderStakingDashboardComponent(<AdaStakingDashboard selectedAccount={selectedAccount} />, {
        state: createStakingDashboardState({
            accounts: [adaAccount],
            positions: { [adaAccount.key]: [position] },
        }),
        productInfo: {
            [adaEverstakeProduct.id]: mockStakingProductInfo({ rate: EVERSTAKE_RATE }),
        },
    });
};

describe('AdaStakingDashboard', () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/32138
    it('shows no claim card for a staked account with rewards, as Cardano claims from the staking card', () => {
        renderAdaStakingDashboard();

        expect(screen.getByTestId('@wallet/staking/card')).toBeInTheDocument();
        expect(screen.queryByTestId('@staking/can-claim-card')).not.toBeInTheDocument();
    });

    describe('the APY card', () => {
        it('shows the rate of a delegation to an Everstake pool', () => {
            renderAdaStakingDashboard(delegatedTo(EVERSTAKE_POOL_ID));

            expect(screen.getByTestId('@staking/apy-card')).toHaveTextContent(
                String(EVERSTAKE_RATE),
            );
        });

        it('shows no rate for a registered key without a pool', () => {
            renderAdaStakingDashboard();

            expect(screen.getByTestId('@staking/apy-card')).toHaveTextContent('none');
        });

        it('shows the offered rate while a transaction of a key without a pool is pending', () => {
            renderAdaStakingDashboard(
                mockPosition(adaEverstakeProduct.id, {
                    ...stakedPositionWithRewards,
                    pendingTransactions: [{ txid: 'tx-stake', operation: 'stake' }],
                }),
            );

            expect(screen.getByTestId('@staking/apy-card')).toHaveTextContent(
                String(EVERSTAKE_RATE),
            );
        });

        it('shows no rate for a delegation to a pool Suite does not offer', () => {
            renderAdaStakingDashboard(delegatedTo(OUTSIDE_POOL_ID, adaFiveBinariesProduct));

            expect(screen.getByTestId('@staking/apy-card')).toHaveTextContent('none');
        });
    });
});
