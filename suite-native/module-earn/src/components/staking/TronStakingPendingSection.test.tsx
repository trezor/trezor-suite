import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingAmount,
    type StakingPositionUnlock,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { TronStakingPendingSection } from './TronStakingPendingSection';

const TRX = 1_000_000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NOW_MS = 1_700_000_000_000;

const trx = asNetworkSymbol('trx');
const zero = stakingAmountSchema.parse('0');
const sun = (amount: number) => stakingAmountSchema.parse(String(amount));

const tronProduct = mockStakingProductDescriptor({
    networkSymbol: trx,
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});
const account = mockWalletAccount({ symbol: trx });

type RenderSectionParams = {
    unlocks: StakingPositionUnlock[];
    withdrawable?: StakingAmount;
};

const renderSection = ({ unlocks, withdrawable = zero }: RenderSectionParams) => {
    const unstaking = stakingAmountSchema.parse(
        BigNumber.sum(0, ...unlocks.map(({ amount }) => amount)).toFixed(0),
    );

    return renderWithStoreProvider(<TronStakingPendingSection accountKey={account.key} />, {
        preloadedState: {
            networks: mockNetworksState([account.symbol]),
            wallet: {
                accounts: [account],
                fiat: { current: {}, lastWeek: {} },
            },
            earn: {
                staking: mockStakingState({
                    platform: 'mobile',
                    descriptors: [tronProduct],
                    positions: {
                        [account.key]: [
                            mockStakingPosition({
                                productId: tronProduct.id,
                                balances: {
                                    staked: zero,
                                    pending: zero,
                                    unstaking,
                                    withdrawable,
                                    rewards: zero,
                                },
                                unlocks,
                                targets: [],
                                operations: [],
                                details: {
                                    kind: 'tron-staking',
                                    frozen: { energy: zero, bandwidth: zero },
                                    delegated: { energy: zero, bandwidth: zero },
                                    votingPower: zero,
                                    unallocatedVotingPower: zero,
                                    rewardClaimAvailableAt: null,
                                },
                            }),
                        ],
                    },
                }),
            },
        },
    });
};

const advanceMinutes = (minutes: number) =>
    act(() => {
        jest.advanceTimersByTime(minutes * 60 * 1000);
    });

describe('TronStakingPendingSection', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW_MS });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts the time left down as time passes', async () => {
        await renderSection({
            unlocks: [
                { amount: sun(5 * TRX), availableAt: NOW_MS + DAY_MS + 2 * HOUR_MS + 30_000 },
            ],
        });

        await fireEvent.press(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(
            screen.getByText(
                getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', {
                    days: 1,
                    hours: 2,
                }),
            ),
        ).toBeOnTheScreen();

        await advanceMinutes(1);

        expect(
            screen.getByText(
                getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', {
                    days: 1,
                    hours: 1,
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('shows the withdrawable amount of the position next to its pending unlocks', async () => {
        await renderSection({
            unlocks: [{ amount: sun(3 * TRX), availableAt: NOW_MS + 2 * HOUR_MS }],
            withdrawable: sun(5 * TRX),
        });

        expect(screen.getByTestId('@staking/tron-unstaking-card/container')).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('earn.tron.readyToWithdrawAlert', {
                    amount: '5',
                    displaySymbol: 'TRX',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('moves an unstake from the card to the withdraw banner once it unlocks', async () => {
        await renderSection({ unlocks: [{ amount: sun(5 * TRX), availableAt: NOW_MS + 30_000 }] });

        const readyToWithdrawText = getTranslation('earn.tron.readyToWithdrawAlert', {
            amount: '5',
            displaySymbol: 'TRX',
        });

        expect(screen.getByTestId('@staking/tron-unstaking-card/container')).toBeOnTheScreen();
        expect(screen.queryByText(readyToWithdrawText)).toBeNull();

        await advanceMinutes(1);

        expect(screen.queryByTestId('@staking/tron-unstaking-card/container')).toBeNull();
        expect(screen.getByText(readyToWithdrawText)).toBeOnTheScreen();
    });

    it('shows only the withdraw banner once every unlock has passed', async () => {
        await renderSection({ unlocks: [], withdrawable: sun(5 * TRX) });

        expect(screen.queryByTestId('@staking/tron-unstaking-card/container')).toBeNull();
        expect(
            screen.getByText(
                getTranslation('earn.tron.readyToWithdrawAlert', {
                    amount: '5',
                    displaySymbol: 'TRX',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
