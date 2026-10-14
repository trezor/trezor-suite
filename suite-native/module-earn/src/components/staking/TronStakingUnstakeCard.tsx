import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    selectTronPendingUnstakeBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StakingManagementPendingItem } from './StakingManagementPendingItem';

type TronStakingUnstakeCardProps = {
    accountKey: AccountKey;
};

export const TronStakingUnstakeCard = ({ accountKey }: TronStakingUnstakeCardProps) => {
    const pendingUnstakeBalance = useSelector((state: StakeRootState) =>
        selectTronPendingUnstakeBalanceByAccountKey(state, accountKey),
    );
    const unstakingPeriodInDays = useSelector((state: StakeRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    if (!isPositiveBalance(pendingUnstakeBalance)) return null;

    return (
        <VStack spacing="sp12">
            <Text variant="headline-sm">
                <Translation id="earn.stakingManagementScreen.pendingActions" />
            </Text>
            <StakingManagementPendingItem
                accountKey={accountKey}
                label={
                    <Translation
                        id="earn.stakingManagementScreen.unstakingItem.label"
                        values={{ days: unstakingPeriodInDays }}
                    />
                }
                amount={pendingUnstakeBalance}
            />
        </VStack>
    );
};
