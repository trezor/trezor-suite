import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { StakingPositionBadges } from './StakingPositionBadges';
import { type MockSuiteState } from '../../../../../mocks/mockInitialAppState';
import {
    ETH,
    TRX,
    ZERO_BALANCES,
    amount,
    createEarnStakingTableState,
    ethProduct,
    mockAccount,
    mockStakedPosition,
    trxProduct,
} from '../../dashboard/staking/earnStakingTableTestState';

const HUNDRED_TRX = '100000000';
const FORTY_TRX = '40000000';

const TWO_ETH = '2000000000000000000';

const trxAccount = mockAccount({ symbol: TRX, descriptor: 'TRX', index: 2 });
const ethAccount = mockAccount({ symbol: ETH, descriptor: 'ETH' });

const stakedTrxBalances: StakingPosition['balances'] = {
    ...ZERO_BALANCES,
    staked: amount(HUNDRED_TRX),
};

const renderBadges = (
    unallocatedVotingPower: string,
    balances: StakingPosition['balances'] = stakedTrxBalances,
) => {
    const details: StakingPosition['details'] = {
        kind: 'tron-staking',
        frozen: { energy: amount(HUNDRED_TRX), bandwidth: amount('0') },
        delegated: { energy: amount('0'), bandwidth: amount('0') },
        votingPower: amount(HUNDRED_TRX),
        unallocatedVotingPower: amount(unallocatedVotingPower),
        rewardClaimAvailableAt: null,
    };
    const preloadedState = createEarnStakingTableState({
        accounts: [trxAccount],
        positions: {
            [trxAccount.key]: [
                mockStakedPosition(trxProduct.id, HUNDRED_TRX, { details, balances }),
            ],
        },
    });
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState });

    renderWithProviders(
        { ...services, networks: mockNetworksServices() },
        <StakingPositionBadges
            accountKey={trxAccount.key}
            balances={balances}
            rate={4.2}
            rateKind="apr"
        />,
    );
};

const renderEthBadges = (balances: StakingPosition['balances']) => {
    const preloadedState = createEarnStakingTableState({
        accounts: [ethAccount],
        positions: {
            [ethAccount.key]: [mockStakedPosition(ethProduct.id, TWO_ETH, { balances })],
        },
    });
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState });

    renderWithProviders(
        { ...services, networks: mockNetworksServices() },
        <StakingPositionBadges
            accountKey={ethAccount.key}
            balances={balances}
            rate={3.4}
            rateKind="apy"
        />,
    );
};

describe('StakingPositionBadges', () => {
    it('asks to assign votes instead of showing an APR when no vote is assigned', () => {
        renderBadges(HUNDRED_TRX);

        expect(
            screen.getByText(messages.TR_EARN_TRON_NO_VOTES_BADGE.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByText(/APR/)).not.toBeInTheDocument();
    });

    it('limits the APR to the assigned votes when some votes are left', () => {
        renderBadges(FORTY_TRX);

        expect(screen.getByText(/APR on assigned votes/)).toBeInTheDocument();
        expect(screen.getByText(/votes left/)).toBeInTheDocument();
    });

    it('shows the plain APR when every vote is assigned', () => {
        renderBadges('0');

        expect(screen.getByText(/APR$/)).toBeInTheDocument();
        expect(screen.queryByText(/votes left/)).not.toBeInTheDocument();
    });

    it('shows a whole Ethereum position ready to withdraw instead of its APY', () => {
        renderEthBadges({ ...ZERO_BALANCES, withdrawable: amount(TWO_ETH) });

        expect(
            screen.getByText(messages.TR_EARN_READY_TO_WITHDRAW.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByText(/APY/)).not.toBeInTheDocument();
    });

    it('shows a whole Tron position ready to withdraw instead of its APR', () => {
        renderBadges('0', { ...ZERO_BALANCES, withdrawable: amount(HUNDRED_TRX) });

        expect(
            screen.getByText(messages.TR_EARN_READY_TO_WITHDRAW.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByText(/APR/)).not.toBeInTheDocument();
    });

    it('shows a whole position that is unstaking instead of its rate', () => {
        renderEthBadges({ ...ZERO_BALANCES, unstaking: amount(TWO_ETH) });

        expect(screen.getByText(messages.TR_STAKE_UNSTAKING.defaultMessage)).toBeInTheDocument();
        expect(screen.queryByText(/APY/)).not.toBeInTheDocument();
    });

    it('keeps the rate while part of the position still earns', () => {
        renderEthBadges({
            ...ZERO_BALANCES,
            staked: amount(TWO_ETH),
            withdrawable: amount(TWO_ETH),
        });

        expect(screen.getByText(/APY/)).toBeInTheDocument();
        expect(
            screen.queryByText(messages.TR_EARN_READY_TO_WITHDRAW.defaultMessage),
        ).not.toBeInTheDocument();
    });
});
