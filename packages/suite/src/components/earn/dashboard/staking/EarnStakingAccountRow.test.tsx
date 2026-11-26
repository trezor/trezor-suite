import '@suite-common/test-utils/globalOverrides';

import { type Reducer } from '@reduxjs/toolkit';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { messages } from '@suite/intl';
import { initialMetadataState } from '@suite/metadata';
import { type GotoThunkDeps, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { type StakingDep, TRON_UNLOCKS_REFRESH_INTERVAL_MS } from '@suite-common/earn-staking';
import { mockStakingQueryClient, mockStakingServices } from '@suite-common/earn-staking/mocks';
import { type StakingPosition, type StakingProductInfo } from '@suite-common/earn-staking-common';
import { mockStakingProductInfo } from '@suite-common/earn-staking-common/mocks';
import { Feature, type MessageSystemState } from '@suite-common/message-system';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { type VersionArray } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EarnStakingAccountRow } from './EarnStakingAccountRow';
import {
    ADA,
    ETH,
    TRX,
    ZERO_BALANCES,
    adaProduct,
    amount,
    createEarnStakingTableState,
    ethProduct,
    messageSystemWithStakeOff,
    mockAccount,
    mockStakedPosition,
    trxProduct,
} from './earnStakingTableTestState';
import { type MockSuiteState } from '../../../../../mocks/mockInitialAppState';

const ONE_TRX = '1000000';
const HUNDRED_TRX = '100000000';
const ONE_ETH = '1000000000000000000';
const HUNDRED_ADA = '100000000';
const ADA_REWARDS = '56398';
const HOUR_MS = 60 * 60 * 1000;

const CURRENT_REWARDS = '@earn/dashboard/current-rewards';
const STAKED_AMOUNT = '@earn/dashboard/staked-amount';
const WITHDRAW_BUTTON = '@earn/dashboard/withdraw-button';
const STAKE_MORE_BUTTON = '@earn/dashboard/stake-more-button';
const VOTE_BUTTON = '@earn/dashboard/vote-button';
const CLAIM_BUTTON = '@account/staking/claim-button';
const BUY_BUTTON = '@earn/dashboard/buy-button';

const trxAccount = mockAccount({ symbol: TRX, descriptor: 'TRX', index: 2 });
const fundedTrxAccount = mockAccount({
    symbol: TRX,
    descriptor: 'TRX',
    index: 2,
    availableBalance: HUNDRED_TRX,
});

const tronDetails: StakingPosition['details'] = {
    kind: 'tron-staking',
    frozen: { energy: amount(HUNDRED_TRX), bandwidth: amount('0') },
    delegated: { energy: amount('0'), bandwidth: amount('0') },
    votingPower: amount(HUNDRED_TRX),
    unallocatedVotingPower: amount(HUNDRED_TRX),
    rewardClaimAvailableAt: null,
};
const adaAccount = mockAccount({ symbol: ADA, descriptor: 'ADA', availableBalance: HUNDRED_ADA });

const tronPosition = (overrides: Partial<StakingPosition> = {}) =>
    mockStakedPosition(trxProduct.id, '0', overrides);

// A delegation with an unclaimed reward balance, which Cardano keeps outside the available balance.
const cardanoPosition = (overrides: Partial<StakingPosition> = {}) =>
    mockStakedPosition(adaProduct.id, HUNDRED_ADA, {
        lockup: 'liquid',
        balances: { ...ZERO_BALANCES, staked: amount(HUNDRED_ADA), rewards: amount(ADA_REWARDS) },
        operations: ['unstake', 'claim', 'vote'],
        ...overrides,
    });

type RenderParams = {
    account: Account;
    position: StakingPosition;
    productInfo?: StakingProductInfo;
    messageSystem?: MessageSystemState;
    firmware?: VersionArray;
};

const renderRow = ({ account, position, productInfo, messageSystem, firmware }: RenderParams) => {
    const report = mock<DesktopAnalyticsDep['analytics']['report']>();
    const initialState: MockSuiteState = {
        ...createEarnStakingTableState({
            accounts: [account],
            positions: { [account.key]: [position] },
            messageSystem,
            firmware,
        }),
        metadata: initialMetadataState,
    };
    const reducer: Reducer<MockSuiteState> = (state = initialState, action) => ({
        ...state,
        router: routerReducer(state.router, action),
    });
    const { services } = createTestCompositionRoot<
        GotoThunkDeps & WithServices<StakingDep & DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: initialState,
        reducer,
        services: () => ({
            suiteRouterHistory: mockSuiteRouterHistory(),
            staking: mockStakingServices(),
            analytics: mockDesktopAnalytics(report),
        }),
    });

    renderWithProviders(
        { ...services, networks: mockNetworksServices() },
        <EarnStakingAccountRow account={account} isCardLayout />,
        {
            queryClient: mockStakingQueryClient({
                productInfo: productInfo === undefined ? {} : { [position.productId]: productInfo },
            }),
        },
    );

    return { store: services.store, report };
};

describe('EarnStakingAccountRow', () => {
    it('opens the Tron product dashboard for the selected account', async () => {
        const { store } = renderRow({ account: trxAccount, position: tronPosition() });

        await userEvent.click(screen.getByTestId('@earn/dashboard/staking-account/trx-2'));

        await waitFor(() => {
            expect(store.getState().router).toMatchObject({
                pathname: '/earn/staking/tron',
                hash: '#/trx/2/normal',
                params: { stakingProductId: 'trx:trx:curated:native', accountIndex: 2 },
            });
        });
    });

    describe('Tron clock', () => {
        it('ticks the unlock clock on a Tron row only', () => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval');
            const ethAccount = mockAccount({ symbol: ETH, descriptor: 'ETH' });

            renderRow({
                account: ethAccount,
                position: mockStakedPosition(ethProduct.id, ONE_ETH),
            });

            expect(setIntervalSpy).not.toHaveBeenCalledWith(
                expect.any(Function),
                TRON_UNLOCKS_REFRESH_INTERVAL_MS,
            );

            renderRow({ account: trxAccount, position: tronPosition() });

            expect(setIntervalSpy).toHaveBeenCalledWith(
                expect.any(Function),
                TRON_UNLOCKS_REFRESH_INTERVAL_MS,
            );

            setIntervalSpy.mockRestore();
        });
    });

    describe('current rewards', () => {
        it('rates the frozen TRX and not the unfreeze queue, which the Staked line still counts', () => {
            renderRow({
                account: fundedTrxAccount,
                position: tronPosition({
                    balances: {
                        ...ZERO_BALANCES,
                        staked: amount(HUNDRED_TRX),
                        unstaking: amount('40000000'),
                        withdrawable: amount('20000000'),
                    },
                    // Every vote is cast, so the row reads as active, not as "remaining votes".
                    details: { ...tronDetails, unallocatedVotingPower: amount('0') },
                }),
                productInfo: mockStakingProductInfo({ rate: 4, targets: [] }),
            });

            expect(screen.getByTestId(CURRENT_REWARDS)).toHaveTextContent('4.00 TRX');
            expect(screen.getByTestId(STAKED_AMOUNT)).toHaveTextContent(/160(\.00)? TRX/);
        });
    });

    describe('claim slot', () => {
        it('offers the withdrawal of unfrozen TRX on an account with nothing else', async () => {
            const { store, report } = renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_TRX) },
                }),
            });

            expect(screen.queryByTestId(BUY_BUTTON)).not.toBeInTheDocument();

            const withdrawButton = screen.getByTestId(WITHDRAW_BUTTON);
            expect(withdrawButton).toHaveTextContent(
                messages.TR_EARN_TRON_WITHDRAW_TITLE.defaultMessage,
            );
            expect(withdrawButton).toBeEnabled();

            await userEvent.click(withdrawButton);

            await waitFor(() => {
                expect(store.getState().router.route?.name).toBe('earn-staking-tron-withdraw');
            });
            expect(store.getState().router.params).toMatchObject({
                stakingProductId: 'trx:trx:curated:native',
                symbol: 'trx',
                accountIndex: 2,
                accountType: 'normal',
            });
            expect(report).toHaveBeenCalledWith({
                type: events.stakingUnstakeEvent.name,
                payload: { action: 'continue', step: 'staking-dashboard', networkSymbol: 'trx' },
            });
        });

        it('counts an unlock whose time has passed since the last sync', () => {
            renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, unstaking: amount(ONE_TRX) },
                    unlocks: [{ amount: amount(ONE_TRX), availableAt: Date.now() - HOUR_MS }],
                }),
            });

            expect(screen.getByTestId(WITHDRAW_BUTTON)).toBeEnabled();
            expect(screen.queryByTestId(BUY_BUTTON)).not.toBeInTheDocument();
        });

        it('keeps offering a purchase while the unlock is still maturing', () => {
            renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, unstaking: amount(ONE_TRX) },
                    unlocks: [{ amount: amount(ONE_TRX), availableAt: Date.now() + HOUR_MS }],
                }),
            });

            expect(screen.getByTestId(BUY_BUTTON)).toBeInTheDocument();
            expect(screen.queryByTestId(WITHDRAW_BUTTON)).not.toBeInTheDocument();
        });

        it('disables the withdrawal when the message system switches it off', () => {
            renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_TRX) },
                }),
                messageSystem: messageSystemWithStakeOff(Feature.withdraw.trx),
            });

            expect(screen.getByTestId(WITHDRAW_BUTTON)).toBeDisabled();
        });

        it('disables the withdrawal while one is pending', () => {
            renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_TRX) },
                    pendingTransactions: [{ txid: 'withdraw-txid', operation: 'withdraw' }],
                }),
            });

            expect(screen.getByTestId(WITHDRAW_BUTTON)).toBeDisabled();
        });

        it('keeps the claim of the unstaked principal for Ethereum', () => {
            const ethAccount = mockAccount({ symbol: ETH, descriptor: '0xa' });

            renderRow({
                account: ethAccount,
                position: mockStakedPosition(ethProduct.id, '0', {
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_ETH) },
                    operations: ['stake', 'withdraw'],
                }),
            });

            const claimButton = screen.getByTestId(CLAIM_BUTTON);
            expect(claimButton).toHaveTextContent(
                messages.TR_EARN_STAKING_DASHBOARD_CLAIM_FUNDS.defaultMessage,
            );
            expect(claimButton).toBeEnabled();
            expect(screen.queryByTestId(WITHDRAW_BUTTON)).not.toBeInTheDocument();
        });

        it('disables the claim of the unstaked principal while the Ethereum position withholds it', () => {
            renderRow({
                account: mockAccount({ symbol: ETH, descriptor: '0xa' }),
                position: mockStakedPosition(ethProduct.id, '0', {
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_ETH) },
                    operations: ['stake'],
                }),
            });

            expect(screen.getByTestId(CLAIM_BUTTON)).toBeDisabled();
        });

        it('offers the claim of the Cardano rewards the position offers', () => {
            renderRow({ account: adaAccount, position: cardanoPosition() });

            const claimButton = screen.getByTestId(CLAIM_BUTTON);
            expect(claimButton).toHaveTextContent(messages.TR_EARN_CLAIM_REWARDS.defaultMessage);
            expect(claimButton).toBeEnabled();
        });

        it('keeps the claim of the Cardano rewards visible and disabled while a deregistration is pending, and says so', async () => {
            renderRow({
                account: adaAccount,
                position: cardanoPosition({
                    operations: ['vote'],
                    pendingTransactions: [{ txid: 'deregistration-txid', operation: 'unstake' }],
                }),
            });

            const claimButton = screen.getByTestId(CLAIM_BUTTON);
            expect(claimButton).toHaveTextContent(messages.TR_EARN_CLAIM_REWARDS.defaultMessage);
            expect(claimButton).toBeDisabled();
            expect(screen.queryByTestId(BUY_BUTTON)).not.toBeInTheDocument();

            await userEvent.hover(claimButton);

            expect(
                await screen.findByText(messages.TR_STAKE_CLAIM_TRANSACTION_PENDING.defaultMessage),
            ).toBeInTheDocument();
        });

        it('names the pending claim on the disabled Cardano claim button', async () => {
            renderRow({
                account: adaAccount,
                position: cardanoPosition({
                    operations: ['vote'],
                    pendingTransactions: [{ txid: 'claim-txid', operation: 'claim' }],
                }),
            });

            const claimButton = screen.getByTestId(CLAIM_BUTTON);
            expect(claimButton).toBeDisabled();

            await userEvent.hover(claimButton);

            expect(
                await screen.findByText(messages.TR_STAKE_CLAIM_PENDING.defaultMessage),
            ).toBeInTheDocument();
        });
    });

    describe('Tron flows below the minimum firmware', () => {
        const firmware: VersionArray = [2, 12, 1];

        const expectFirmwarePrompt = (
            store: ReturnType<typeof renderRow>['store'],
            report: jest.Mock,
        ) => {
            expect(
                screen.getByText(
                    messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage,
                ),
            ).toBeInTheDocument();
            expect(store.getState().router.route?.name).not.toMatch(/^earn-staking-/);
            expect(report).not.toHaveBeenCalled();
        };

        it('asks for a firmware update instead of opening the stake flow', async () => {
            const { store, report } = renderRow({
                account: fundedTrxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, staked: amount(HUNDRED_TRX) },
                }),
                firmware,
            });

            const stakeMoreButton = screen.getByTestId(STAKE_MORE_BUTTON);
            expect(stakeMoreButton).toBeEnabled();

            await userEvent.click(stakeMoreButton);

            expectFirmwarePrompt(store, report);
        });

        it('asks for a firmware update instead of opening the vote flow', async () => {
            const { store, report } = renderRow({
                account: fundedTrxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, staked: amount(HUNDRED_TRX) },
                    details: tronDetails,
                }),
                firmware,
            });

            const voteButton = screen.getByTestId(VOTE_BUTTON);
            expect(voteButton).toBeEnabled();

            await userEvent.click(voteButton);

            expectFirmwarePrompt(store, report);
        });

        it('asks for a firmware update instead of opening the withdrawal flow', async () => {
            const { store, report } = renderRow({
                account: trxAccount,
                position: tronPosition({
                    balances: { ...ZERO_BALANCES, withdrawable: amount(ONE_TRX) },
                }),
                firmware,
            });

            const withdrawButton = screen.getByTestId(WITHDRAW_BUTTON);
            expect(withdrawButton).toBeEnabled();

            await userEvent.click(withdrawButton);

            expectFirmwarePrompt(store, report);
        });
    });
});
