import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import {
    CARDANO_ACTIVATION_PERIOD_DAYS,
    CARDANO_EPOCH_DAYS,
    SOLANA_EPOCH_DAYS,
} from '@suite-common/wallet-constants';
import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    getStakingAccountCurrentStatus,
    getTxStakeType,
    isPending,
} from '@suite-common/wallet-utils';
import { Column, Paragraph } from '@trezor/components';

import { ProgressLabelData } from '../components/ProgressLabels/types';

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

    const lastStakeTx = stakeTxs.find(tx => !isPending(tx));
    const lastTxStakeType = lastStakeTx ? getTxStakeType(lastStakeTx) : '';

    const ethereumProgressLabelsData: ProgressLabelData[] = useMemo(
        () => [
            {
                id: 0,
                'data-testid': '@staking/transaction-status',
                progressState: (() => {
                    if (isStakeConfirming) return 'active';

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
                progressState: (() => {
                    if (!isStakeConfirming && isStakePending) return 'active';
                    if (!isStakeConfirming && !isStakePending) return 'done';

                    return 'stale';
                })(),
                children: (
                    <Column>
                        <Translation id="TR_STAKE_ADDING_TO_POOL" />
                        {isDaysToAddToPoolShown && (
                            <Paragraph typographyStyle="label" variant="tertiary">
                                <Translation
                                    id="TR_STAKE_APPROXIMATE_DAYS"
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
        ],
        [daysToAddToPool, isDaysToAddToPoolShown, isStakeConfirming, isStakePending],
    );

    const solStakingAccountStatus = getStakingAccountCurrentStatus(account);

    const solanaProgressLabelsData: ProgressLabelData[] = useMemo(
        () => [
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
                progressState: (() => {
                    if (solStakingAccountStatus === 'activating') return 'active';
                    if (solStakingAccountStatus !== 'activating') return 'done';

                    return 'stale';
                })(),
                children: (
                    <Column>
                        <Translation id="TR_STAKE_WARM_UP_PERIOD" />

                        <Paragraph typographyStyle="label" variant="tertiary">
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
                    if (solStakingAccountStatus === 'active') {
                        return 'active';
                    }

                    return 'stale';
                })(),
                children: (
                    <Column>
                        <Translation id="TR_STAKE_STAKED_AND_EARNING" />

                        <Paragraph typographyStyle="label" variant="tertiary">
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
        ],
        [solStakingAccountStatus, isStakeConfirming],
    );

    const isUnstake = pendingTxStakeType === 'unstake';

    const cardanoProgressLabelsData: ProgressLabelData[] = useMemo(
        () =>
            [
                {
                    id: 0,
                    progressState: (() => {
                        if (isStakeConfirming) return 'active';

                        return 'done';
                    })(),
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
                            {!isUnstake && (
                                <Paragraph typographyStyle="label" variant="tertiary">
                                    <Translation
                                        id="TR_UP_TO_DAYS"
                                        values={{
                                            count: CARDANO_ACTIVATION_PERIOD_DAYS,
                                        }}
                                    />
                                </Paragraph>
                            )}
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
                                <Translation id="TR_STAKE_RECEIVE_DEPOSIT_IN_ACCOUNT" />
                            ) : (
                                <Translation id="TR_STAKE_STAKED_AND_EARNING" />
                            )}

                            <Paragraph typographyStyle="label" variant="tertiary">
                                {isUnstake ? (
                                    <Translation id="TR_STAKE_RECEIVE_DEPOSIT_IN_ACCOUNT_INSTANTLY" />
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
            ].filter(Boolean) as ProgressLabelData[],
        [isStakeConfirming, isStakePending, isUnstake],
    );

    if (
        account.networkType === 'cardano' &&
        // progress bar not ready for claim (cardano)
        (pendingTxStakeType === 'claim' ||
            // progress bar should not be visible when staking active and last tx was claim (cardano)
            lastTxStakeType === 'claim' ||
            // no progress bar when not staking with us, but show it when pending tx as it can be update provider
            (!isStakedWithEverstake && !pendingTxStakeType))
    ) {
        return [];
    }

    switch (account.networkType) {
        case 'ethereum':
            return ethereumProgressLabelsData;
        case 'solana':
            return solanaProgressLabelsData;
        case 'cardano':
            return cardanoProgressLabelsData;
        default:
            return [];
    }
};
