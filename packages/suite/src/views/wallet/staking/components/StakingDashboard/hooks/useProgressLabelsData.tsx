import { Translation } from '@suite/intl';
import {
    type SolanaStakeAccountsStatus,
    getSolanaStakeAccountsStatus,
} from '@suite-common/earn-staking';
import { type StakingOperation, type StakingPosition } from '@suite-common/earn-staking-common';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
    CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
} from '@suite-common/wallet-constants';
import { type Account, type StakeType } from '@suite-common/wallet-types';
import { Column, Paragraph } from '@trezor/components';

import { type ProgressLabelData } from '../components/ProgressLabels/types';

type BuildEthereumLabelsParams = {
    isStakeConfirming: boolean;
    isStakePending: boolean;
    daysToAddToPool: number | null;
};

const buildEthereumLabels = ({
    isStakeConfirming,
    isStakePending,
    daysToAddToPool,
}: BuildEthereumLabelsParams): ProgressLabelData[] => [
    {
        id: 0,
        'data-testid': '@staking/transaction-status',
        progressState: isStakeConfirming ? 'active' : 'done',
        children: isStakeConfirming ? (
            <Translation id="TR_TX_CONFIRMING" />
        ) : (
            <Translation id="TR_TX_CONFIRMED" />
        ),
    },
    {
        id: 1,
        'data-testid': '@staking/adding-to-pool-status',
        progressState: (() => {
            if (isStakeConfirming) return 'stale';

            return isStakePending ? 'active' : 'done';
        })(),
        children: (
            <Column>
                <Translation id="TR_EARN_ADDING_TO_POOL" />
                {daysToAddToPool !== null && (
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EARN_APPROXIMATE_DAYS"
                            values={{
                                count: daysToAddToPool,
                            }}
                        />
                    </Paragraph>
                )}
            </Column>
        ),
    },
    {
        id: 2,
        'data-testid': '@staking/reward-status',
        progressState: (() => {
            if (!isStakeConfirming && !isStakePending) {
                return 'active';
            }

            return 'stale';
        })(),
        children: <Translation id="TR_STAKE_STAKED_AND_EARNING" />,
    },
];

type BuildSolanaLabelsParams = {
    stakeAccountsStatus: SolanaStakeAccountsStatus | null;
    isStakeConfirming: boolean;
    daysToAddToPool: number | null;
};

const buildSolanaLabels = ({
    stakeAccountsStatus,
    isStakeConfirming,
    daysToAddToPool,
}: BuildSolanaLabelsParams): ProgressLabelData[] => [
    {
        id: 0,
        'data-testid': '@staking/transaction-status',
        progressState: stakeAccountsStatus === 'inactive' ? 'active' : 'done',
        children: isStakeConfirming ? (
            <Translation id="TR_TX_CONFIRMING" />
        ) : (
            <Translation id="TR_TX_CONFIRMED" />
        ),
    },
    {
        id: 1,
        'data-testid': '@staking/adding-to-pool-status',
        progressState: stakeAccountsStatus === 'activating' ? 'active' : 'done',
        children: (
            <Column>
                <Translation id="TR_EARN_WARM_UP_PERIOD" />
                {daysToAddToPool !== null && (
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation id="TR_UP_TO_DAYS" values={{ count: daysToAddToPool }} />
                    </Paragraph>
                )}
            </Column>
        ),
    },
    {
        id: 2,
        'data-testid': '@staking/reward-status',
        // Every stake account is past its warm-up once none is inactive or activating.
        progressState: stakeAccountsStatus === null ? 'active' : 'stale',
        children: <Translation id="TR_STAKE_STAKED_AND_EARNING" />,
    },
];

type BuildCardanoLabelsParams = {
    isStakeConfirming: boolean;
    isStakePending: boolean;
    isUnstake: boolean;
};

const buildCardanoLabels = ({
    isStakeConfirming,
    isStakePending,
    isUnstake,
}: BuildCardanoLabelsParams): ProgressLabelData[] =>
    [
        {
            id: 0,
            progressState: (() => (isStakeConfirming ? 'active' : 'done'))(),
            children: isStakeConfirming ? (
                <Translation id="TR_TX_CONFIRMING" />
            ) : (
                <Translation id="TR_TX_CONFIRMED" />
            ),
        },
        !isUnstake && {
            id: 1,
            progressState: (() => {
                if (isStakePending && !isStakeConfirming) return 'active';

                return 'stale';
            })(),
            children: (
                <Column>
                    <Translation id="TR_STAKE_ACTIVATION_PERIOD" />
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EARN_APPROXIMATE_DAYS_RANGE"
                            values={{
                                minDays: CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
                                maxDays: CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
                            }}
                        />
                    </Paragraph>
                </Column>
            ),
        },
        {
            id: 2,
            progressState: (() => {
                if (!isStakePending && !isStakeConfirming) {
                    return 'active';
                }

                return 'stale';
            })(),
            children: (
                <Column>
                    {isUnstake ? (
                        <Translation id="TR_EARN_RECEIVE_DEPOSIT_IN_ACCOUNT" />
                    ) : (
                        <Translation id="TR_STAKE_STAKED_AND_EARNING" />
                    )}

                    {isUnstake && (
                        <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                            <Translation id="TR_EARN_INSTANTLY" />
                        </Paragraph>
                    )}
                </Column>
            ),
        },
    ].filter(Boolean) as ProgressLabelData[];

type ShouldHideProgressBarParams = {
    networkType: NetworkType;
    pendingOperation: StakingOperation | null;
    lastTxStakeType?: StakeType;
    isStakedWithProvider: boolean;
};

const shouldHideProgressBar = ({
    networkType,
    pendingOperation,
    lastTxStakeType,
    isStakedWithProvider,
}: ShouldHideProgressBarParams) => {
    switch (networkType) {
        case 'cardano': {
            // Cardano does not support progress bar for claim
            if (pendingOperation === 'claim' || lastTxStakeType === 'claim') return true;

            // progress bar should be hidden for change-delegate
            if (pendingOperation === 'vote') return true;

            // Hide progress not staking with us,
            // but show it when pending tx as it can be update provider
            return !isStakedWithProvider && pendingOperation === null;
        }

        case 'ethereum': {
            // Ethereum does not show progress for unstake or claim
            return pendingOperation === 'unstake' || pendingOperation === 'withdraw';
        }
        case 'solana':
        default:
            return false;
    }
};

type UseProgressLabelsData = {
    daysToAddToPool: number | null;
    isStakeConfirming: boolean;
    isStakePending: boolean;
    account: Account;
    position: StakingPosition | null;
    lastTxStakeType?: StakeType;
    isStakedWithProvider: boolean;
};

export const useProgressLabelsData = ({
    daysToAddToPool,
    isStakeConfirming,
    isStakePending,
    account,
    position,
    lastTxStakeType,
    isStakedWithProvider,
}: UseProgressLabelsData): ProgressLabelData[] => {
    const pendingOperation = position?.pendingTransactions[0]?.operation ?? null;
    const isUnstake = pendingOperation === 'unstake';

    const stakeAccountsStatus = getSolanaStakeAccountsStatus(position?.details ?? null);

    if (
        shouldHideProgressBar({
            networkType: account.networkType,
            pendingOperation,
            lastTxStakeType,
            isStakedWithProvider,
        })
    ) {
        return [];
    }

    switch (account.networkType) {
        case 'ethereum':
            return buildEthereumLabels({
                isStakeConfirming,
                isStakePending,
                daysToAddToPool,
            });
        case 'solana':
            return buildSolanaLabels({
                stakeAccountsStatus,
                isStakeConfirming,
                daysToAddToPool,
            });
        case 'cardano':
            return buildCardanoLabels({
                isStakeConfirming,
                isStakePending,
                isUnstake,
            });
        default:
            return [];
    }
};
