import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TRON_UNFREEZE_DELAY_SECONDS } from '@suite-common/wallet-core';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultTron } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, screen, within } from '@suite-native/test-utils-store';
import { type TronStakingInfo, type TronUnstakingBatch } from '@trezor/blockchain-link-types';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard';

const TRX = 1_000_000;
const DAY = 24 * 60 * 60;
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

type BuildUnfreezeTxParams = {
    unstakeAmount: string;
    expireTime: number;
    resource?: string;
};

const buildUnfreezeTx = ({
    unstakeAmount,
    expireTime,
    resource,
}: BuildUnfreezeTxParams): WalletAccountTransaction =>
    testMocks.getWalletTransaction({
        symbol: asNetworkSymbol('trx'),
        blockTime: expireTime - TRON_UNFREEZE_DELAY_SECONDS,
        tronSpecific: {
            contractType: 'UnfreezeBalanceV2Contract',
            operation: 'unstake',
            resource,
            unstakeAmount,
        },
    });

type RenderCardParams = {
    unstakingBatches: TronUnstakingBatch[];
    transactions?: WalletAccountTransaction[];
};

const renderCard = ({ unstakingBatches, transactions = [] }: RenderCardParams) => {
    const account = buildTronAccount(unstakingBatches);

    return renderWithStoreProvider(
        <TronStakingUnstakeCard accountKey={account.key} nowSeconds={NOW_SECONDS} />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    transactions: { transactions: { [account.key]: transactions } },
                    fiat: { current: { 'trx-usd': { rate: 0.25 } }, lastWeek: {} },
                },
            },
        },
    );
};

describe('TronStakingUnstakeCard', () => {
    it('shows each pending unstake with its resource and the days left until it unlocks', async () => {
        const energyExpireTime = NOW_SECONDS + 6 * DAY;
        const bandwidthExpireTime = NOW_SECONDS + 13 * DAY - 60;

        await renderCard({
            unstakingBatches: [
                { amount: String(50 * TRX), expireTime: bandwidthExpireTime },
                { amount: String(100 * TRX), expireTime: energyExpireTime },
            ],
            transactions: [
                buildUnfreezeTx({
                    unstakeAmount: String(100 * TRX),
                    expireTime: energyExpireTime,
                    resource: 'energy',
                }),
                buildUnfreezeTx({
                    unstakeAmount: String(50 * TRX),
                    expireTime: bandwidthExpireTime,
                }),
            ],
        });

        const firstRow = screen.getByTestId('@staking/tron-unstaking-card/row-0');
        const secondRow = screen.getByTestId('@staking/tron-unstaking-card/row-1');

        expect(firstRow).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.daysLocked', { days: 6 }),
            { exact: false },
        );
        expect(firstRow).toHaveTextContent(getTranslation('earn.tron.resources.energy'), {
            exact: false,
        });
        expect(secondRow).toHaveTextContent(
            getTranslation('earn.tron.unstakingCard.daysLocked', { days: 13 }),
            { exact: false },
        );
        expect(secondRow).toHaveTextContent(getTranslation('earn.tron.resources.bandwidth'), {
            exact: false,
        });
    });

    it('shows the unstaking title only on the first row', async () => {
        await renderCard({
            unstakingBatches: [
                { amount: String(50 * TRX), expireTime: NOW_SECONDS + 13 * DAY },
                { amount: String(100 * TRX), expireTime: NOW_SECONDS + 6 * DAY },
            ],
        });

        const title = getTranslation('earn.tron.unstakingCard.title');

        expect(screen.getAllByText(title)).toHaveLength(1);
        expect(
            within(screen.getByTestId('@staking/tron-unstaking-card/row-0')).getByText(title),
        ).toBeOnTheScreen();
    });

    it('shows the fiat value instead of a resource when no unfreeze transaction matches', async () => {
        await renderCard({
            unstakingBatches: [{ amount: String(5 * TRX), expireTime: NOW_SECONDS + DAY }],
            transactions: [
                buildUnfreezeTx({
                    unstakeAmount: String(7 * TRX),
                    expireTime: NOW_SECONDS + DAY,
                    resource: 'energy',
                }),
            ],
        });

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0')).toHaveTextContent(
            '$1.25',
            { exact: false },
        );
        expect(screen.queryByText(getTranslation('earn.tron.resources.energy'))).toBeNull();
        expect(screen.queryByText(getTranslation('earn.tron.resources.bandwidth'))).toBeNull();
    });

    it('renders nothing when every unstake is already withdrawable', async () => {
        await renderCard({
            unstakingBatches: [{ amount: String(5 * TRX), expireTime: NOW_SECONDS - 10 }],
        });

        expect(screen.queryByTestId('@staking/tron-unstaking-card/container')).toBeNull();
        expect(
            screen.queryByText(getTranslation('earn.stakingManagementScreen.pendingActions')),
        ).toBeNull();
    });
});
