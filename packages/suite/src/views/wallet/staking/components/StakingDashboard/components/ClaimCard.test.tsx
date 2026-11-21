import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { events } from '@suite/analytics';
import { messages } from '@suite/intl';
import { type StakingPosition } from '@suite-common/earn-staking-common';

import { ClaimCard } from './ClaimCard';
import {
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    renderStakingDashboardComponent,
} from '../../stakingDashboardTestState';

const filledRequest = (overrides: Partial<StakingPosition> = {}) =>
    mockPosition(ethProduct.id, {
        balances: {
            staked: amount('1000000000000000000'),
            pending: amount('0'),
            unstaking: amount('0'),
            withdrawable: amount('500000000000000000'),
            rewards: amount('0'),
        },
        operations: ['stake', 'unstake', 'withdraw'],
        ...overrides,
    });

const renderCard = (position: StakingPosition, disabledFeatures?: readonly string[]) =>
    renderStakingDashboardComponent(<ClaimCard account={ethAccount} />, {
        state: createStakingDashboardState({
            accounts: [ethAccount],
            positions: { [ethAccount.key]: [position] },
            disabledFeatures,
        }),
    });

describe('ClaimCard', () => {
    it('renders nothing while the withdrawal request is not filled', () => {
        renderCard(
            filledRequest({
                balances: {
                    staked: amount('1000000000000000000'),
                    pending: amount('0'),
                    unstaking: amount('500000000000000000'),
                    withdrawable: amount('0'),
                    rewards: amount('0'),
                },
                operations: ['stake', 'unstake'],
            }),
        );

        expect(screen.queryByTestId('@staking/can-claim-card')).not.toBeInTheDocument();
    });

    it('offers the withdrawable amount of a filled request', async () => {
        const { report } = renderCard(filledRequest());

        expect(screen.getByTestId('@staking/can-claim-with-symbol')).toHaveTextContent('0.5 ETH');
        expect(
            screen.getByText(messages.TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM.defaultMessage),
        ).toBeInTheDocument();

        const claimButton = screen.getByTestId('@account/staking/claim-button');
        expect(claimButton).toBeEnabled();

        await userEvent.click(claimButton);

        expect(report).toHaveBeenCalledWith({
            type: events.stakingClaimEvent.name,
            payload: { action: 'continue', step: 'staking-dashboard', networkSymbol: 'eth' },
        });
    });

    it('keeps the amount as pending while the withdraw transaction confirms', () => {
        renderCard(
            filledRequest({
                operations: ['stake'],
                pendingTransactions: [{ txid: 'tx-withdraw', operation: 'withdraw' }],
            }),
        );

        expect(
            screen.getByText(messages.TR_STAKE_CLAIM_PENDING.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.getByTestId('@staking/can-claim-with-symbol')).toHaveTextContent('0.5 ETH');
        expect(screen.queryByTestId('@account/staking/claim-button')).not.toBeInTheDocument();
    });

    it('disables the claim when the message system switches it off', () => {
        renderCard(filledRequest(), ['eth.staking.claim']);

        expect(screen.getByTestId('@staking/can-claim-with-symbol')).toHaveTextContent('0.5 ETH');
        expect(screen.getByTestId('@account/staking/claim-button')).toBeDisabled();
    });
});
