import { useMemo } from 'react';

import { Paragraph, Column } from '@trezor/components';

import { Translation } from 'src/components/suite';

import { ProgressLabelData } from '../components/ProgressLabels/types';

type UseProgressLabelsData = {
    daysToAddToPool?: number;
    isDaysToAddToPoolShown: boolean;
    isStakeConfirming: boolean;
    isStakePending: boolean;
};

export const useProgressLabelsData = ({
    daysToAddToPool,
    isDaysToAddToPoolShown,
    isStakeConfirming,
    isStakePending,
}: UseProgressLabelsData) => {
    const progressLabelsData: ProgressLabelData[] = useMemo(
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
                    <Column alignItems="normal">
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

    return { progressLabelsData };
};
