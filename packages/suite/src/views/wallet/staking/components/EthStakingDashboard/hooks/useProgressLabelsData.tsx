import { useMemo } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { ProgressLabelData } from '../components/ProgressLabels/types';
import { Translation } from 'src/components/suite';

const DaysToAddToPool = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface UseProgressLabelsData {
    daysToAddToPool: number;
    isDaysToAddToPoolShown: boolean;
    isStakeConfirming: boolean;
    isStakePending: boolean;
}

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
                children: <Translation id="TR_TX_CONFIRMED" />,
            },
            {
                id: 1,
                progressState: (() => {
                    if (!isStakeConfirming && isStakePending) return 'active';
                    if (!isStakeConfirming && !isStakePending) return 'done';

                    return 'stale';
                })(),
                children: (
                    <div>
                        <Translation id="TR_STAKE_ADDING_TO_POOL" />
                        {isDaysToAddToPoolShown && (
                            <DaysToAddToPool>
                                ~
                                <Translation
                                    id="TR_STAKE_DAYS"
                                    values={{
                                        days: daysToAddToPool,
                                    }}
                                />
                            </DaysToAddToPool>
                        )}
                    </div>
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
