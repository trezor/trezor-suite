import React from 'react';
import { useSelector } from 'react-redux';

import { Divider, VStack } from '@suite-native/atoms';
import {
    NativeStakingRootState,
    selectIsStakePendingByAccountKey,
    selectRewardsBalanceByAccountKey,
    selectTotalStakePendingByAccountKey,
} from '@suite-native/staking';

import { EarnItemRewardInfo } from './EarnItemRewardInfo';
import { EarnItem } from '../types';

type EarnItemRewardSectionProps = {} & EarnItem;

export const EarnItemRewardSection = ({ accountKey, symbol }: EarnItemRewardSectionProps) => {
    const rewardsBalance = useSelector((state: NativeStakingRootState) =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    const isStakePending = useSelector((state: NativeStakingRootState) =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );

    const totalStakePending = useSelector((state: NativeStakingRootState) =>
        selectTotalStakePendingByAccountKey(state, accountKey),
    );

    return (
        <>
            <Divider />
            <VStack paddingTop="sp8" paddingHorizontal="sp16" justifyContent="center">
                {isStakePending && (
                    <EarnItemRewardInfo type="pending" value={totalStakePending} symbol={symbol} />
                )}
                <EarnItemRewardInfo type="rewards" value={rewardsBalance} symbol={symbol} />
            </VStack>
        </>
    );
};
