import { useMemo } from 'react';

import { Paragraph, Column } from '@trezor/components';
import { Account } from '@suite-common/wallet-types';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';

import { Translation } from 'src/components/suite';

import { ProgressLabelData } from '../components/ProgressLabels/types';

type UseProgressLabelsData = {
    daysToAddToPool?: number;
    isDaysToAddToPoolShown: boolean;
    isStakeConfirming: boolean;
    isStakePending: boolean;
    selectedAccount?: Account;
    solStakingAccountStatus?: string | null;
};

export const useProgressLabelsData = ({
    daysToAddToPool,
    isDaysToAddToPoolShown,
    isStakeConfirming,
    isStakePending,
    selectedAccount,
    solStakingAccountStatus,
}: UseProgressLabelsData) => {
    const ethereumProgressLabelsData: ProgressLabelData[] = useMemo(
        () => [
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
            {
                id: 1,
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
                                ~
                                <Translation
                                    id="TR_STAKE_DAYS"
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

    const solanaProgressLabelsData: ProgressLabelData[] = useMemo(
        () => [
            {
                id: 0,
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
                progressState: (() => {
                    if (solStakingAccountStatus === 'activating') return 'active';
                    if (solStakingAccountStatus !== 'activating') return 'done';

                    return 'stale';
                })(),
                children: (
                    <Column>
                        <Translation id="TR_STAKE_WARM_UP_PERIOD" />

                        <Paragraph typographyStyle="label" variant="tertiary">
                            ~
                            <Translation
                                id="TR_STAKE_DAYS"
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
                            ~
                            <Translation
                                id="TR_STAKE_DAYS"
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

    switch (selectedAccount?.networkType) {
        case 'ethereum':
            return ethereumProgressLabelsData;
        case 'solana':
            return solanaProgressLabelsData;
        default:
            return [];
    }
};
