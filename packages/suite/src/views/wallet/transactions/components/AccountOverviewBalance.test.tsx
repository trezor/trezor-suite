import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { AccountHeaderProvider } from '#src/support/suite/AccountHeaderProvider';
import {
    ADA,
    ETH,
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    renderStakingDashboardComponent,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { AccountOverviewBalance } from './AccountOverviewBalance';

const lockedStake = (overrides: Partial<StakingPosition> = {}) =>
    mockPosition(ethProduct.id, {
        balances: {
            staked: amount('2000000000000000000'),
            pending: amount('0'),
            unstaking: amount('0'),
            withdrawable: amount('0'),
            rewards: amount('0'),
        },
        operations: ['stake', 'unstake'],
        ...overrides,
    });

const liquidDelegation = () =>
    mockPosition(adaEverstakeProduct.id, {
        lockup: 'liquid',
        balances: {
            staked: amount('100000000'),
            pending: amount('0'),
            unstaking: amount('0'),
            withdrawable: amount('0'),
            rewards: amount('0'),
        },
        operations: ['unstake', 'claim', 'vote'],
        details: { kind: 'cardano-delegation', poolId: null, drep: null },
    });

const renderBalance = (account: Account, positions: readonly StakingPosition[]) => {
    const selectedAccount: SelectedAccountLoaded = {
        status: 'loaded',
        account,
        network: getNetwork(account.symbol),
        params: undefined,
    };

    return renderStakingDashboardComponent(
        <AccountHeaderProvider>
            <AccountOverviewBalance selectedAccount={selectedAccount} />
        </AccountHeaderProvider>,
        {
            state: createStakingDashboardState({
                accounts: [account],
                positions: { [account.key]: positions },
            }),
        },
    );
};

describe('AccountOverviewBalance', () => {
    it('notes that a locked stake is not in the balance', () => {
        renderBalance(ethAccount, [lockedStake()]);

        expect(
            screen.getByText(
                messages.TR_BALANCE_EXCLUDES_STAKING.defaultMessage.replace(
                    '{networkDisplaySymbol}',
                    'ETH',
                ),
            ),
        ).toBeInTheDocument();
    });

    it('notes tokens and the stake together', () => {
        const account = mockWalletAccount({
            symbol: ETH,
            availableBalance: '3000000000000000000',
            tokens: [mockAccountToken({ balance: '250' })],
        });

        renderBalance(account, [lockedStake()]);

        expect(
            screen.getByText(
                messages.TR_BALANCE_EXCLUDES_TOKENS_AND_STAKING.defaultMessage.replace(
                    '{networkDisplaySymbol}',
                    'ETH',
                ),
            ),
        ).toBeInTheDocument();
    });

    it('keeps no note for a liquid Cardano delegation, which is the balance itself', () => {
        renderBalance(adaAccount, [liquidDelegation()]);

        expect(screen.queryByText(/included in the balance/)).not.toBeInTheDocument();
        expect(screen.getByTestId('@wallet/account/crypto-balance')).toBeInTheDocument();
    });

    it('keeps no note for an inactive pool entry', () => {
        renderBalance(ethAccount, [
            lockedStake({
                status: 'inactive',
                balances: {
                    staked: amount('0'),
                    pending: amount('0'),
                    unstaking: amount('0'),
                    withdrawable: amount('0'),
                    rewards: amount('0'),
                },
                operations: ['stake'],
                targets: [],
            }),
        ]);

        expect(screen.queryByText(/included in the balance/)).not.toBeInTheDocument();
    });

    it('keeps no note without a position', () => {
        renderBalance(mockWalletAccount({ symbol: ADA }), []);

        expect(screen.queryByText(/included in the balance/)).not.toBeInTheDocument();
    });
});
