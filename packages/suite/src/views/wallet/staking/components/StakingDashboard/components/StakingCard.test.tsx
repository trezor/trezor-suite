import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { events } from '@suite/analytics';
import { messages } from '@suite/intl';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { StakingCard } from './StakingCard';
import {
    ZERO_BALANCES,
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    products,
    renderStakingDashboardComponent,
} from '../../stakingDashboardTestState';

const ONE_ETH = '1000000000000000000';

const ethPosition = (overrides: Partial<StakingPosition> = {}) =>
    mockPosition(ethProduct.id, {
        balances: {
            staked: amount('2012000000000000000'),
            pending: amount('500000000000000000'),
            unstaking: amount('250000000000000000'),
            withdrawable: amount('0'),
            rewards: amount('12000000000000000'),
        },
        operations: ['stake', 'unstake'],
        ...overrides,
    });

const adaPosition = (overrides: Partial<StakingPosition> = {}) =>
    mockPosition(adaEverstakeProduct.id, {
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
        ...overrides,
    });

const EVERSTAKE_POOL_ID = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';
const SECONDS_PER_DAY = 24 * 60 * 60;

const mockConfirmedCardanoTransaction = (
    subtype: Required<NonNullable<WalletAccountTransaction['cardanoSpecific']>>['subtype'],
    daysAgo: number,
) =>
    testMocks.getWalletTransaction({
        txid: `${subtype}-${daysAgo}`,
        descriptor: adaAccount.descriptor,
        deviceState: adaAccount.deviceState,
        symbol: adaAccount.symbol,
        blockTime: Math.floor(Date.now() / 1000) - daysAgo * SECONDS_PER_DAY,
        cardanoSpecific: { subtype },
    });

const adaDelegation = (rewards: string) =>
    adaPosition({
        balances: {
            staked: amount(new BigNumber('100000000').plus(rewards).toFixed()),
            pending: amount('0'),
            unstaking: amount('0'),
            withdrawable: amount('0'),
            rewards: amount(rewards),
        },
        targets: [
            {
                address: EVERSTAKE_POOL_ID,
                providerId: adaEverstakeProduct.providerId,
                amount: amount('100000000'),
            },
        ],
        details: { kind: 'cardano-delegation', poolId: EVERSTAKE_POOL_ID, drep: null },
    });

const DSOL = asNetworkSymbol('dsol');
const dsolProduct = mockStakingProductDescriptor({
    networkSymbol: DSOL,
    type: 'native',
    rewardsKind: 'expected',
    options: [],
    messageSystemFeatures: {},
});
const dsolAccount = mockWalletAccount({ symbol: DSOL, availableBalance: '2500000000' });

/** A devnet stake whose position carries the next epoch's estimate as its rewards. */
const dsolPosition = () =>
    mockPosition(dsolProduct.id, {
        balances: { ...ZERO_BALANCES, staked: amount('2000000000'), rewards: amount('12000000') },
        operations: ['stake', 'unstake'],
    });

type RenderParams = {
    position: StakingPosition;
    disabledFeatures?: readonly string[];
    daysToAddToPool?: number | null;
    daysToUnstake?: number | null;
};

const renderEthCard = ({
    position,
    disabledFeatures,
    daysToAddToPool = 2,
    daysToUnstake = 3,
}: RenderParams) =>
    renderStakingDashboardComponent(
        <StakingCard
            account={ethAccount}
            daysToAddToPool={daysToAddToPool}
            daysToUnstake={daysToUnstake}
        />,
        {
            state: createStakingDashboardState({
                accounts: [ethAccount],
                positions: { [ethAccount.key]: [position] },
                disabledFeatures,
            }),
        },
    );

type RenderAdaCardParams = Pick<RenderParams, 'position' | 'disabledFeatures'> & {
    transactions?: WalletAccountTransaction[];
};

const renderAdaCard = ({ position, disabledFeatures, transactions = [] }: RenderAdaCardParams) => {
    const state = createStakingDashboardState({
        accounts: [adaAccount],
        positions: { [adaAccount.key]: [position] },
        disabledFeatures,
    });

    return renderStakingDashboardComponent(<StakingCard account={adaAccount} />, {
        state: {
            ...state,
            wallet: {
                ...state.wallet,
                transactions: {
                    ...state.wallet.transactions,
                    transactions: { [adaAccount.key]: transactions },
                },
            },
        },
    });
};

describe('StakingCard', () => {
    beforeAll(() => {
        // The progress labels measure themselves; jsdom has no ResizeObserver.
        class ResizeObserverStub {
            observe() {}
            unobserve() {}
            disconnect() {}
        }

        Object.defineProperty(globalThis, 'ResizeObserver', {
            configurable: true,
            writable: true,
            value: ResizeObserverStub,
        });
    });

    describe('on an Ethereum position', () => {
        it('shows the principal, the pending stake, the unstaking amount with its days and the rewards', () => {
            renderEthCard({ position: ethPosition() });

            expect(screen.getByTestId('@account/staking/staked-with-symbol')).toHaveTextContent(
                '2 ETH',
            );
            expect(screen.getByTestId('@account/staking/pending-with-symbol')).toHaveTextContent(
                '0.5 ETH',
            );
            expect(screen.getByTestId('@account/staking/unstaking-with-symbol')).toHaveTextContent(
                '0.25 ETH',
            );
            expect(screen.getByTestId('@account/staking/rewards-with-symbol')).toHaveTextContent(
                '0.012 ETH',
            );
            expect(screen.getByText(/~3 days/)).toBeInTheDocument();
        });

        it('omits the day counts until the periods are known', () => {
            renderEthCard({ position: ethPosition(), daysToAddToPool: null, daysToUnstake: null });

            expect(screen.getByTestId('@account/staking/unstaking')).toBeInTheDocument();
            expect(screen.getByTestId('@staking/adding-to-pool-status')).toBeInTheDocument();
            expect(screen.queryByText(/days/)).not.toBeInTheDocument();
        });

        it('offers stake more and unstake on an active position', async () => {
            const { report } = renderEthCard({ position: ethPosition() });

            expect(screen.getByTestId('@account/staking/stake-more-button')).toBeEnabled();

            const unstakeButton = screen.getByTestId('@account/staking/unstake-button');
            expect(unstakeButton).toBeEnabled();

            await userEvent.click(unstakeButton);

            expect(report).toHaveBeenCalledWith({
                type: events.stakingUnstakeEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: 'eth',
                },
            });
        });

        it('disables unstake when the message system switches it off', () => {
            renderEthCard({
                position: ethPosition(),
                disabledFeatures: ['eth.staking.unstake'],
            });

            expect(screen.getByTestId('@account/staking/unstake-button')).toBeDisabled();
            expect(screen.getByTestId('@account/staking/stake-more-button')).toBeEnabled();
        });

        it('shows the progress and withholds unstake while a stake is confirming', () => {
            renderEthCard({
                position: ethPosition({
                    operations: ['stake'],
                    pendingTransactions: [{ txid: 'tx-stake', operation: 'stake' }],
                }),
            });

            expect(screen.getByTestId('@staking/progress-labels')).toBeInTheDocument();
            expect(screen.getByTestId('@staking/transaction-status')).toHaveTextContent(
                messages.TR_TX_CONFIRMING.defaultMessage,
            );
            expect(screen.getByTestId('@account/staking/unstake-button')).toBeDisabled();
        });

        it('hides the staked amount of a position whose stake is only pending', () => {
            renderEthCard({
                position: ethPosition({
                    balances: {
                        staked: amount('0'),
                        pending: amount(ONE_ETH),
                        unstaking: amount('0'),
                        withdrawable: amount('0'),
                        rewards: amount('0'),
                    },
                    operations: ['stake'],
                }),
            });

            expect(screen.getByTestId('@account/staking/staked-with-symbol')).toHaveTextContent(
                '0 ETH',
            );
            expect(screen.getByTestId('@account/staking/pending-with-symbol')).toHaveTextContent(
                '1 ETH',
            );
            expect(screen.queryByTestId('@account/staking/unstaking')).not.toBeInTheDocument();
        });
    });

    describe('on a Cardano position', () => {
        const activationLabel = messages.TR_STAKE_ACTIVATION_PERIOD.defaultMessage;

        it('shows the full balance as staked and claims the rewards of a delegated key', async () => {
            const { report } = renderAdaCard({ position: adaPosition() });

            expect(screen.getByTestId('@account/staking/full-balance')).toBeInTheDocument();
            expect(screen.getByTestId('@account/staking/rewards-with-symbol')).toHaveTextContent(
                '0.056398 ADA',
            );

            const claimButton = screen.getByTestId('@account/staking/claim-rewards-button');
            expect(claimButton).toBeEnabled();
            expect(screen.getByTestId('@account/staking/unstake-button')).toBeEnabled();
            expect(screen.getByTestId('@account/staking/change-delegate-button')).toBeEnabled();

            await userEvent.click(claimButton);

            expect(report).toHaveBeenCalledWith({
                type: events.stakingClaimEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: 'ada',
                },
            });
        });

        it('withholds the claim and the unstake until a DRep is delegated', () => {
            renderAdaCard({
                position: adaPosition({
                    operations: ['vote'],
                    warnings: [{ code: 'missing-drep' }],
                }),
            });

            expect(screen.getByTestId('@account/staking/claim-rewards-button')).toBeDisabled();
            expect(screen.getByTestId('@account/staking/unstake-button')).toBeDisabled();
            expect(screen.getByTestId('@account/staking/change-delegate-button')).toBeEnabled();
        });

        it('disables the change of delegate when the message system switches voting off', () => {
            renderAdaCard({
                position: adaPosition(),
                disabledFeatures: ['ada.staking.vote'],
            });

            expect(screen.getByTestId('@account/staking/change-delegate-button')).toBeDisabled();
            expect(screen.getByTestId('@account/staking/claim-rewards-button')).toBeEnabled();
        });

        it('keeps the activation timeline after a vote on a newly delegated stake', () => {
            renderAdaCard({
                position: adaDelegation('0'),
                transactions: [
                    mockConfirmedCardanoTransaction('governance_delegation', 0),
                    mockConfirmedCardanoTransaction('stake_registration', 1),
                ],
            });

            expect(screen.getByText(activationLabel)).toBeVisible();
        });

        it('does not show a new activation after changing the delegate on an established stake', () => {
            renderAdaCard({
                position: adaDelegation('0'),
                transactions: [
                    mockConfirmedCardanoTransaction('governance_delegation', 0),
                    mockConfirmedCardanoTransaction('stake_registration', 30),
                ],
            });

            expect(screen.queryByText(activationLabel)).not.toBeInTheDocument();
        });

        it('keeps activation hidden after claiming rewards and changing the delegate', () => {
            renderAdaCard({
                position: adaDelegation('0'),
                transactions: [
                    mockConfirmedCardanoTransaction('governance_delegation', 0),
                    mockConfirmedCardanoTransaction('withdrawal', 1),
                    mockConfirmedCardanoTransaction('stake_delegation', 7),
                ],
            });

            expect(screen.queryByText(activationLabel)).not.toBeInTheDocument();
        });

        it('shows no timeline once the delegation has earned a reward', () => {
            renderAdaCard({
                position: adaDelegation('56398'),
                transactions: [mockConfirmedCardanoTransaction('stake_delegation', 7)],
            });

            expect(screen.queryByText(activationLabel)).not.toBeInTheDocument();
        });
    });

    describe('on a Solana devnet position', () => {
        it('shows no rewards total for a Solana network the rewards API does not serve', () => {
            renderStakingDashboardComponent(<StakingCard account={dsolAccount} />, {
                state: {
                    ...createStakingDashboardState({
                        accounts: [dsolAccount],
                        positions: { [dsolAccount.key]: [dsolPosition()] },
                        descriptors: [...products, dsolProduct],
                    }),
                    networks: mockNetworksState([DSOL]),
                },
            });

            expect(screen.getByTestId('@account/staking/rewards-with-symbol')).toHaveTextContent(
                /^0 /,
            );
        });
    });
});
