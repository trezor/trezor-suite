import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_DAYS,
    CARDANO_EPOCH_DAYS,
    SOLANA_EPOCH_DAYS,
} from '@suite-common/wallet-constants';
import {
    type Account,
    type StakeType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getStakingAccountCurrentStatus,
    getTxStakeType,
    isPending,
} from '@suite-common/wallet-utils';
import { Column, Paragraph } from '@trezor/components';

import { type ProgressLabelData } from '../components/ProgressLabels/types';

const buildEthereumLabels = ({
    isStakeConfirming,
    isStakePending,
    isDaysToAddToPoolShown,
    daysToAddToPool,
}: {
    isStakeConfirming: boolean;
    isStakePending: boolean;
    isDaysToAddToPoolShown: boolean;
    daysToAddToPool?: number;
}): ProgressLabelData[] => [
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
                {isDaysToAddToPoolShown && (
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

const buildSolanaLabels = ({
    solStakingAccountStatus,
    isStakeConfirming,
}: {
    solStakingAccountStatus: string | null;
    isStakeConfirming: boolean;
}): ProgressLabelData[] => [
    {
        id: 0,
        'data-testid': '@staking/transaction-status',
        progressState: (() => {
            if (solStakingAccountStatus === 'inactive') return 'active';

            return 'done';
        })(),
        children: isStakeConfirming ? (
            <Translation id="TR_TX_CONFIRMING" />
        ) : (
            <Translation id="TR_TX_CONFIRMED" />
        ),
    },
    {
        id: 1,
        'data-testid': '@staking/adding-to-pool-status',
        progressState: (() => (solStakingAccountStatus === 'activating' ? 'active' : 'done'))(),
        children: (
            <Column>
                <Translation id="TR_EARN_WARM_UP_PERIOD" />

                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_UP_TO_DAYS"
                        values={{
                            count: SOLANA_EPOCH_DAYS,
                        }}
                    />
                </Paragraph>
            </Column>
        ),
    },
    {
        id: 2,
        'data-testid': '@staking/reward-status',
        progressState: (() => {
            if (solStakingAccountStatus === 'active') return 'active';

            return 'stale';
        })(),
        children: (
            <Column>
                <Translation id="TR_STAKE_STAKED_AND_EARNING" />

                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_UP_TO_DAYS"
                        values={{
                            count: SOLANA_EPOCH_DAYS,
                        }}
                    />
                </Paragraph>
            </Column>
        ),
    },
];

const buildCardanoLabels = ({
    isStakeConfirming,
    isStakePending,
    isUnstake,
}: {
    isStakeConfirming: boolean;
    isStakePending: boolean;
    isUnstake: boolean;
}): ProgressLabelData[] =>
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
                            id="TR_UP_TO_DAYS"
                            values={{
                                count: CARDANO_ACTIVATION_PERIOD_DAYS,
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

                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        {isUnstake ? (
                            <Translation id="TR_EARN_RECEIVE_DEPOSIT_IN_ACCOUNT_INSTANTLY" />
                        ) : (
                            <Translation
                                id="TR_UP_TO_DAYS"
                                values={{
                                    count: CARDANO_EPOCH_DAYS,
                                }}
                            />
                        )}
                    </Paragraph>
                </Column>
            ),
        },
    ].filter(Boolean) as ProgressLabelData[];

const shouldHideProgressBar = ({
    networkType,
    pendingTxStakeType,
    lastTxStakeType,
    isStakedWithEverstake,
}: {
    networkType: NetworkType;
    pendingTxStakeType?: StakeType;
    lastTxStakeType?: StakeType;
    isStakedWithEverstake: boolean;
}) => {
    const isClaimPending = pendingTxStakeType === 'claim';
    const isUnstakePending = pendingTxStakeType === 'unstake';
    const isChangeDelegatePending = pendingTxStakeType === 'change-delegate';
    const isClaimLast = lastTxStakeType === 'claim';
    const hasNoPendingTx = !pendingTxStakeType;

    switch (networkType) {
        case 'cardano': {
            // Cardano does not support progress bar for claim
            if (isClaimPending || isClaimLast) return true;

            // progress bar should be hidden for change-delegate
            if (isChangeDelegatePending) return true;

            // Hide progress not staking with us,
            // but show it when pending tx as it can be update provider
            if (!isStakedWithEverstake && hasNoPendingTx) return true;

            return false;
        }

        case 'ethereum': {
            // Ethereum does not show progress for unstake or claim
            return isUnstakePending || isClaimPending;
        }
        case 'solana':
        default:
            return false;
    }
};

type UseProgressLabelsData = {
    daysToAddToPool?: number;
    isDaysToAddToPoolShown: boolean;
    isStakeConfirming: boolean;
    isStakePending: boolean;
    account: Account;
    stakeTxs: WalletAccountTransaction[];
    isStakedWithEverstake: boolean;
};

export const useProgressLabelsData = ({
    daysToAddToPool,
    isDaysToAddToPoolShown,
    isStakeConfirming,
    isStakePending,
    account,
    stakeTxs,
    isStakedWithEverstake,
}: UseProgressLabelsData) => {
    const lastPendingStakeTx = stakeTxs.find(tx => isPending(tx));
    const pendingTxStakeType = lastPendingStakeTx ? getTxStakeType(lastPendingStakeTx) : undefined;
    const isUnstake = pendingTxStakeType === 'unstake';

    const lastStakeTx = stakeTxs.find(tx => !isPending(tx));
    const lastTxStakeType = lastStakeTx ? getTxStakeType(lastStakeTx) : undefined;

    const solStakingAccountStatus = getStakingAccountCurrentStatus(account);

    return useMemo(() => {
        if (
            shouldHideProgressBar({
                networkType: account.networkType,
                pendingTxStakeType,
                lastTxStakeType,
                isStakedWithEverstake,
            })
        ) {
            return [];
        }

        switch (account.networkType) {
            case 'ethereum':
                return buildEthereumLabels({
                    isStakeConfirming,
                    isStakePending,
                    isDaysToAddToPoolShown,
                    daysToAddToPool,
                });
            case 'solana':
                return buildSolanaLabels({
                    solStakingAccountStatus,
                    isStakeConfirming,
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
    }, [
        account.networkType,
        daysToAddToPool,
        isDaysToAddToPoolShown,
        isStakeConfirming,
        isStakePending,
        isStakedWithEverstake,
        isUnstake,
        pendingTxStakeType,
        solStakingAccountStatus,
        lastTxStakeType,
    ]);
};
