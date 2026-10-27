import { Fragment } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    getTronPendingUnstakingBatches,
    selectAccountNetworkSymbol,
    selectTronUnstakingBatchesByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, CardDivider, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TronStakingUnstakeRow } from './TronStakingUnstakeRow';

type TronStakingUnstakeCardProps = {
    accountKey: AccountKey;
};

export const TronStakingUnstakeCard = ({ accountKey }: TronStakingUnstakeCardProps) => {
    const symbol = useSelector((state: StakeRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const batches = useSelector((state: StakeRootState) =>
        selectTronUnstakingBatchesByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const pendingBatches = getTronPendingUnstakingBatches({ batches, symbol });

    if (pendingBatches.length === 0) return null;

    return (
        <VStack spacing="sp12">
            <Text variant="headline-sm">
                <Translation id="earn.stakingManagementScreen.pendingActions" />
            </Text>
            <Card noPadding testID="@staking/tron-unstaking-card/container">
                {pendingBatches.map(({ amount, daysLocked, resource }, index) => (
                    <Fragment key={`${resource ?? 'unknown'}-${daysLocked}-${index}`}>
                        {index > 0 && <CardDivider horizontalPadding={0} />}
                        <TronStakingUnstakeRow
                            index={index}
                            amount={amount}
                            daysLocked={daysLocked}
                            resource={resource}
                            symbol={symbol}
                        />
                    </Fragment>
                ))}
            </Card>
        </VStack>
    );
};
