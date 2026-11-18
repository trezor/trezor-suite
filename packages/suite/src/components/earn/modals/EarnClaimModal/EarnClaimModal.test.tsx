import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren } from 'react';

import { act, screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { stakingActions } from '@suite-common/earn-staking';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';

import { useCardanoStaking } from '#src/hooks/earn/useCardanoStaking';
import { useStakeCompose } from '#src/hooks/wallet/form/useStakeCompose';
import {
    ZERO_BALANCES,
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    renderStakingDashboardComponent,
    solAccount,
    solProduct,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { EarnClaimModal } from './EarnClaimModal';

jest.mock('#src/hooks/wallet/form/useStakeCompose', () => ({ useStakeCompose: jest.fn() }));
jest.mock('#src/hooks/earn/useCardanoStaking', () => ({ useCardanoStaking: jest.fn() }));
jest.mock('#src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));
jest.mock(
    '#src/components/suite/modals/ReduxModal/UserContextModal/SolanaStakingLimitBanner',
    () => ({
        SolanaStakingLimitBanner: () => null,
    }),
);
jest.mock('@suite/form', () => ({
    Form: ({ children }: PropsWithChildren) => <form>{children}</form>,
}));

const renderModal = (account: Account, position: StakingPosition) =>
    renderStakingDashboardComponent(<EarnClaimModal account={account} />, {
        state: createStakingDashboardState({
            accounts: [account],
            positions: { [account.key]: [position] },
        }),
    });

describe('EarnClaimModal', () => {
    beforeEach(() => {
        jest.mocked(useStakeCompose).mockReturnValue({
            composeRequest: jest.fn().mockResolvedValue(undefined),
            composedLevels: undefined,
            isLoading: false,
            onFeeLevelChange: jest.fn(),
        });

        jest.mocked(useCardanoStaking).mockReturnValue({
            calculateFeeAndDeposit: jest.fn(),
            withdrawingAvailable: { status: true },
            delegatingAvailable: { status: true },
            fee: '174301',
            deposit: undefined,
            rewards: '56398',
            loading: false,
            isStakingDisabled: false,
        });
    });

    it('claims the unstaked principal of an Ethereum position', async () => {
        renderModal(
            ethAccount,
            mockPosition(ethProduct.id, {
                balances: {
                    ...ZERO_BALANCES,
                    staked: amount('1000000000000000000'),
                    withdrawable: amount('500000000000000000'),
                },
                operations: ['stake', 'unstake', 'withdraw'],
            }),
        );

        expect(
            await screen.findByTestId('@staking/claim-modal/amount-with-symbol'),
        ).toHaveTextContent('0.5 ETH');
    });

    it('updates an open Solana claim after the claimable stake disappears', async () => {
        const { store } = renderModal(
            solAccount,
            mockPosition(solProduct.id, {
                balances: {
                    ...ZERO_BALANCES,
                    staked: amount('1000000000'),
                    withdrawable: amount('1500000000'),
                },
                operations: ['stake', 'unstake', 'withdraw'],
            }),
        );

        expect(
            await screen.findByTestId('@staking/claim-modal/amount-with-symbol'),
        ).toHaveTextContent('1.5 SOL');
        expect(screen.getByTestId('@staking/claim-modal/continue-button')).toBeEnabled();

        await act(async () => {
            store.dispatch(
                stakingActions.positionsSynced({ accountKey: solAccount.key, positions: [] }),
            );
        });

        expect(screen.getByTestId('@staking/claim-modal/amount-with-symbol')).toHaveTextContent(
            '0 SOL',
        );
        expect(screen.getByTestId('@staking/claim-modal/continue-button')).toBeDisabled();
        expect(
            screen.getByText(messages.TR_STAKE_SOL_NOTHING_TO_CLAIM.defaultMessage),
        ).toBeVisible();
    });

    it('claims the reward balance of a Cardano delegation', async () => {
        renderModal(
            adaAccount,
            mockPosition(adaEverstakeProduct.id, {
                lockup: 'liquid',
                balances: {
                    ...ZERO_BALANCES,
                    staked: amount('100056398'),
                    rewards: amount('56398'),
                },
                operations: ['unstake', 'claim', 'vote'],
                details: { kind: 'cardano-delegation', poolId: null, drep: null },
            }),
        );

        expect(
            await screen.findByTestId('@modal/claim/rewards-amount-with-symbol'),
        ).toHaveTextContent('0.056398 ADA');
    });
});
