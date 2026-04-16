import { Divider, VStack } from '@suite-native/atoms';
import {
    selectIsStakePendingByAccountKey,
    selectRewardsBalanceByAccountKey,
    selectTotalStakePendingByAccountKey,
    useSelector,
} from '@suite-native/staking';

import { type StakingEarnItem } from '../types';
import { EarnItemRewardInfo } from './EarnItemRewardInfo';

type EarnItemRewardSectionProps = StakingEarnItem;

export const EarnItemRewardSection = ({ accountKey, symbol }: EarnItemRewardSectionProps) => {
    const rewardsBalance = useSelector(state =>
        selectRewardsBalanceByAccountKey(state, accountKey),
    );

    const isStakePending = useSelector(state =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );

    const totalStakePending =
        useSelector(state => selectTotalStakePendingByAccountKey(state, accountKey)) ?? null;

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
