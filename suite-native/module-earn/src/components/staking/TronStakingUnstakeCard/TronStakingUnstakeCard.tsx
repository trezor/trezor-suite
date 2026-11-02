import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    getTronPendingUnstakingBatches,
    selectAccountNetworkSymbol,
    selectTronPendingUnstakeBalanceByAccountKey,
    selectTronUnstakingBatchesByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    AnimatedChevron,
    Card,
    CardDivider,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { TronStakingUnstakeRow } from './TronStakingUnstakeRow';
import { EarnApproximateFiatAmount } from '../../earn/EarnApproximateFiatAmount';

type TronStakingUnstakeCardProps = {
    accountKey: AccountKey;
    nowSeconds: number;
};

export const TronStakingUnstakeCard = ({ accountKey, nowSeconds }: TronStakingUnstakeCardProps) => {
    const symbol = useSelector((state: StakeRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const batches = useSelector((state: StakeRootState) =>
        selectTronUnstakingBatchesByAccountKey(state, accountKey),
    );
    const pendingBalance = useSelector((state: StakeRootState) =>
        selectTronPendingUnstakeBalanceByAccountKey(state, accountKey, nowSeconds),
    );

    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    if (!symbol) return null;

    const pendingBatches = getTronPendingUnstakingBatches({ batches, symbol, nowSeconds });

    if (pendingBatches.length === 0) return null;

    return (
        <VStack spacing="sp12">
            <Text variant="headline-sm">
                <Translation id="earn.stakingManagementScreen.pendingActions" />
            </Text>
            <Card noPadding testID="@staking/tron-unstaking-card/container">
                <PressableOpacity
                    onPress={handleToggle}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    testID="@staking/tron-unstaking-card/toggle"
                >
                    <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        paddingHorizontal="sp16"
                        paddingVertical="sp16"
                        spacing="sp12"
                    >
                        <Text variant="body-sm-strong">
                            <Translation id="earn.tron.unstakingCard.title" />
                        </Text>
                        <HStack alignItems="center" spacing="sp12">
                            <VStack spacing="sp4" alignItems="flex-end">
                                <ExactCryptoAmountFormatter
                                    value={pendingBalance}
                                    symbol={symbol}
                                    variant="body-md-strong"
                                    color="contentPrimary"
                                />
                                <EarnApproximateFiatAmount
                                    amount={pendingBalance}
                                    symbol={symbol}
                                />
                            </VStack>
                            <AnimatedChevron isExpanded={isExpanded} />
                        </HStack>
                    </HStack>
                </PressableOpacity>
                {isExpanded &&
                    pendingBatches.map(({ amount, expireTime }, index) => (
                        <Fragment key={`${expireTime}-${index}`}>
                            <CardDivider horizontalPadding={0} />
                            <TronStakingUnstakeRow
                                index={index}
                                amount={amount}
                                expireTime={expireTime}
                                nowSeconds={nowSeconds}
                                symbol={symbol}
                            />
                        </Fragment>
                    ))}
            </Card>
        </VStack>
    );
};
