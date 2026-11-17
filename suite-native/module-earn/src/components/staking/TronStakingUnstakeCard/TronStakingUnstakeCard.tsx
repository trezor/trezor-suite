import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionEntry,
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
import { useNow } from '@trezor/react-utils';

import { TronStakingUnstakeRow } from './TronStakingUnstakeRow';
import { EarnApproximateFiatAmount } from '../../earn/EarnApproximateFiatAmount';

const UNSTAKING_REFRESH_INTERVAL_MS = 60 * 1000;

type TronStakingUnstakeCardProps = {
    accountKey: AccountKey;
};

export const TronStakingUnstakeCard = ({ accountKey }: TronStakingUnstakeCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const nowMs = useNow(UNSTAKING_REFRESH_INTERVAL_MS);

    const positionEntry = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionEntry(state, accountKey),
    );

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    if (positionEntry === null || positionEntry.position.unlocks.length === 0) {
        return null;
    }

    const { position, descriptor } = positionEntry;
    const { networkSymbol: symbol } = descriptor;

    const pendingBalance = formatStakingAmount({
        amount: position.balances.unstaking,
        networkSymbol: symbol,
    });

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
                    position.unlocks.map(({ amount, availableAt }, index) => (
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
