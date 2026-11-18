import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionEntry,
    settleTronUnlocks,
} from '@suite-common/earn-staking';
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
    nowMs: number;
};

export const TronStakingUnstakeCard = ({ accountKey, nowMs }: TronStakingUnstakeCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const positionEntry = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionEntry(state, accountKey),
    );

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    if (positionEntry === null) {
        return null;
    }

    const { unlocks, unstaking } = settleTronUnlocks({ position: positionEntry.position, nowMs });

    if (unlocks.length === 0) {
        return null;
    }

    const { networkSymbol: symbol } = positionEntry.descriptor;

    const pendingBalance = formatStakingAmount({ amount: unstaking, networkSymbol: symbol });

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
                    unlocks.map(({ amount, availableAt }, index) => (
                        <Fragment key={`${availableAt}-${index}`}>
                            <CardDivider horizontalPadding={0} />

                            <TronStakingUnstakeRow
                                index={index}
                                amount={formatStakingAmount({ amount, networkSymbol: symbol })}
                                availableAt={availableAt}
                                nowMs={nowMs}
                                symbol={symbol}
                            />
                        </Fragment>
                    ))}
            </Card>
        </VStack>
    );
};
