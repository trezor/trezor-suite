import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultTron } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type TronUnstakingBatch } from '@trezor/blockchain-link-types';

import { TronStakingPendingSection } from './TronStakingPendingSection';

const TRX = 1_000_000;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const NOW_SECONDS = 1_700_000_000;

const buildTronAccount = (unstakingBatches: TronUnstakingBatch[]): Account => ({
    ...mockWalletAccount({ symbol: asNetworkSymbol('trx') }),
    ...networkSpecificDefaultTron,
    misc: {
        tronResources: {
            availableStakedBandwidth: 0,
            totalStakedBandwidth: 0,
            availableFreeBandwidth: 0,
            totalFreeBandwidth: 0,
            availableEnergy: 0,
            totalEnergy: 0,
            totalEnergyLimit: 0,
            totalEnergyWeight: 0,
            totalBandwidthLimit: 0,
            totalBandwidthWeight: 0,
            stakingInfo: {
                stakedBalance: '0',
                stakedBalanceEnergy: '0',
                stakedBalanceBandwidth: '0',
                unstakingBatches,
                totalVotingPower: '0',
                availableVotingPower: '0',
                votes: [],
                unclaimedReward: '0',
                latestWithdrawTime: 0,
                delegatedBalanceEnergy: '0',
                delegatedBalanceBandwidth: '0',
            },
        },
    },
});

const renderSection = (unstakingBatches: TronUnstakingBatch[]) => {
    const account = buildTronAccount(unstakingBatches);

    return renderWithStoreProvider(<TronStakingPendingSection accountKey={account.key} />, {
        preloadedState: {
            wallet: {
                accounts: [account],
                fiat: { current: {}, lastWeek: {} },
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
        jest.useFakeTimers({ now: NOW_SECONDS * 1000 });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts the time left down as time passes', async () => {
        await renderSection([
            { amount: String(5 * TRX), expireTime: NOW_SECONDS + DAY + 2 * HOUR + 30 },
        ]);

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

    it('moves an unstake from the card to the withdraw banner once it unlocks', async () => {
        await renderSection([{ amount: String(5 * TRX), expireTime: NOW_SECONDS + 30 }]);

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
});
