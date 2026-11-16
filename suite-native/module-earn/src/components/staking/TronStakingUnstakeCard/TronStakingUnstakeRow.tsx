import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { EarnApproximateFiatAmount } from '../../earn/EarnApproximateFiatAmount';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type TronStakingUnstakeRowProps = {
    index: number;
    amount: string;
    availableAt: number | null;
    nowMs: number;
    symbol: NetworkSymbol;
};

export const TronStakingUnstakeRow = ({
    index,
    amount,
    availableAt,
    nowMs,
    symbol,
}: TronStakingUnstakeRowProps) => {
    const msLeft = availableAt === null ? null : Math.max(availableAt - nowMs, 0);
    const days = msLeft === null ? null : Math.floor(msLeft / DAY_MS);
    const hours = msLeft === null ? null : Math.max(Math.floor((msLeft % DAY_MS) / HOUR_MS), 1);

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="sp16"
            paddingVertical="sp12"
            spacing="sp16"
            testID={`@staking/tron-unstaking-card/row-${index}`}
        >
            {days !== null && hours !== null && (
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id={
                            days > 0
                                ? 'earn.tron.unstakingCard.readyInDaysAndHours'
                                : 'earn.tron.unstakingCard.readyInHours'
                        }
                        values={{ days, hours }}
                    />
                </Text>
            )}

            <VStack spacing="sp2" alignItems="flex-end">
                <ExactCryptoAmountFormatter
                    value={amount}
                    symbol={symbol}
                    color="contentPrimary"
                    variant="body-sm-strong"
                />

                <EarnApproximateFiatAmount amount={amount} symbol={symbol} />
            </VStack>
        </HStack>
    );
};
