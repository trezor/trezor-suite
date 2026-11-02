import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultTron } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type TronStakingInfo, type TronUnstakingBatch } from '@trezor/blockchain-link-types';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard';

const TRX = 1_000_000;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const NOW_SECONDS = 1_700_000_000;

const buildStakingInfo = (unstakingBatches: TronUnstakingBatch[]): TronStakingInfo => ({
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
});

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
            stakingInfo: buildStakingInfo(unstakingBatches),
        },
    },
});

const renderCard = (unstakingBatches: TronUnstakingBatch[]) => {
    const account = buildTronAccount(unstakingBatches);

    return renderWithStoreProvider(
        <TronStakingUnstakeCard accountKey={account.key} nowSeconds={NOW_SECONDS} />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    fiat: { current: { 'trx-usd': { rate: 0.25 } }, lastWeek: {} },
                },
            },
        },
    );
};

describe('TronStakingUnstakeCard', () => {
    it('starts collapsed with the pending total', async () => {
        await renderCard([
            { amount: String(50 * TRX), expireTime: NOW_SECONDS + 13 * DAY - 60 },
            { amount: String(100 * TRX), expireTime: NOW_SECONDS + 6 * DAY + 5 * HOUR },
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

    it('lists each pending unstake with the days and hours left once expanded', async () => {
        await renderCard([
            { amount: String(100 * TRX), expireTime: NOW_SECONDS + 6 * DAY + 5 * HOUR },
            { amount: String(50 * TRX), expireTime: NOW_SECONDS + 13 * DAY - 60 },
            { amount: String(5 * TRX), expireTime: NOW_SECONDS + 10 * 60 },
        ]);

        await fireEvent.press(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInHours', { hours: 1 }),
            { exact: false },
        );
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', { days: 6, hours: 5 }),
            { exact: false },
        );
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-2')).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.readyInDaysAndHours', {
                days: 12,
                hours: 23,
            }),
            { exact: false },
        );
    });

    it('keeps full TRX precision and marks fiat estimates in the total and withdrawal rows', async () => {
        await renderCard([
            { amount: '1000001', expireTime: NOW_SECONDS + 2 * HOUR },
            { amount: String(TRX), expireTime: NOW_SECONDS + 3 * HOUR },
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
            { amount: String(5 * TRX), expireTime: NOW_SECONDS + 2 * HOUR },
            { amount: String(10 * TRX), expireTime: NOW_SECONDS + 3 * HOUR },
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

    it('renders nothing when every unstake is already withdrawable', async () => {
        await renderCard([{ amount: String(5 * TRX), expireTime: NOW_SECONDS - 10 }]);

        expect(screen.queryByTestId('@staking/tron-unstaking-card/container')).toBeNull();
        expect(
            screen.queryByText(getTranslation('earn.stakingManagementScreen.pendingActions')),
        ).toBeNull();
    });
});
