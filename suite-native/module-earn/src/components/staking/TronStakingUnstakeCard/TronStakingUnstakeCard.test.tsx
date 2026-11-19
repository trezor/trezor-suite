import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingPositionUnlock,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard';

const TRX = 1_000_000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NOW_MS = 1_700_000_000_000;

const trx = asNetworkSymbol('trx');
const zero = stakingAmountSchema.parse('0');
const sun = (amount: number | string) => stakingAmountSchema.parse(String(amount));

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

const renderCard = (unlocks: StakingPositionUnlock[]) => {
    const unstaking = stakingAmountSchema.parse(
        BigNumber.sum(0, ...unlocks.map(({ amount }) => amount)).toFixed(0),
    );

    return renderWithStoreProvider(
        <TronStakingUnstakeCard accountKey={account.key} nowMs={NOW_MS} />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    fiat: { current: { 'trx-usd': { rate: 0.25 } }, lastWeek: {} },
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
                                        withdrawable: unlocks.length === 0 ? sun(5 * TRX) : zero,
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
        },
    );
};

describe('TronStakingUnstakeCard', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW_MS });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts collapsed with the pending total', async () => {
        await renderCard([
            { amount: sun(50 * TRX), availableAt: NOW_MS + 13 * DAY_MS - 60_000 },
            { amount: sun(100 * TRX), availableAt: NOW_MS + 6 * DAY_MS + 5 * HOUR_MS },
        ]);

        expect(screen.getByText(getTranslation('earn.tron.unstakingCard.title'))).toBeOnTheScreen();
        expect(screen.getByText(/150\sTRX/)).toBeOnTheScreen();
        expect(screen.getByText('≈')).toBeOnTheScreen();
        expect(screen.getByTestId('@staking/tron-unstaking-card/container')).toHaveTextContent(
            '$37.50',
            { exact: false },
        );
        expect(screen.queryByTestId('@staking/tron-unstaking-card/row-0')).toBeNull();
    });

    it('lists each pending unlock with the days and hours left once expanded', async () => {
        await renderCard([
            { amount: sun(100 * TRX), availableAt: NOW_MS + 6 * DAY_MS + 5 * HOUR_MS },
            { amount: sun(50 * TRX), availableAt: NOW_MS + 13 * DAY_MS - 60_000 },
            { amount: sun(5 * TRX), availableAt: NOW_MS + 10 * 60_000 },
        ]);

        await fireEvent.press(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', { days: 6, hours: 5 }),
            { exact: false },
        );
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', {
                days: 12,
                hours: 23,
            }),
            { exact: false },
        );
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-2')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInHours', { hours: 1 }),
            { exact: false },
        );
    });

    it('keeps full TRX precision and marks fiat estimates in the total and withdrawal rows', async () => {
        await renderCard([
            { amount: sun('1000001'), availableAt: NOW_MS + 2 * HOUR_MS },
            { amount: sun(TRX), availableAt: NOW_MS + 3 * HOUR_MS },
        ]);

        expect(screen.getByText(/2\.000001\sTRX/)).toBeOnTheScreen();

        await fireEvent.press(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toHaveTextContent(
            /1\.000001\sTRX/,
        );
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1')).toHaveTextContent(
            /1\sTRX/,
        );
        expect(screen.getAllByText('≈')).toHaveLength(3);
    });

    it('hides the withdrawals when collapsed and shows them again when reopened', async () => {
        await renderCard([
            { amount: sun(5 * TRX), availableAt: NOW_MS + 2 * HOUR_MS },
            { amount: sun(10 * TRX), availableAt: NOW_MS + 3 * HOUR_MS },
        ]);

        const toggle = screen.getByTestId('@staking/tron-unstaking-card/toggle');

        await fireEvent.press(toggle);
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toBeOnTheScreen();
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1')).toBeOnTheScreen();

        await fireEvent.press(toggle);
        expect(screen.queryByTestId('@staking/tron-unstaking-card/row-0')).toBeNull();
        expect(screen.queryByTestId('@staking/tron-unstaking-card/row-1')).toBeNull();

        await fireEvent.press(toggle);
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toBeOnTheScreen();
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1')).toBeOnTheScreen();
    });

    it('renders nothing when the position has no pending unlock', async () => {
        await renderCard([]);

        expect(screen.queryByTestId('@staking/tron-unstaking-card/container')).toBeNull();
        expect(
            screen.queryByText(getTranslation('earn.stakingManagementScreen.pendingActions')),
        ).toBeNull();
    });
});
