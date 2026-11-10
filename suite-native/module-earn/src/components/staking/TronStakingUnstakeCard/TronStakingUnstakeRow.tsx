import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { EarnApproximateFiatAmount } from '../../earn/EarnApproximateFiatAmount';

const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

type TronStakingUnstakeRowProps = {
    index: number;
    amount: string;
    expireTime: number;
    nowSeconds: number;
    symbol: NetworkSymbol;
};

export const TronStakingUnstakeRow = ({
    index,
    amount,
    expireTime,
    nowSeconds,
    symbol,
}: TronStakingUnstakeRowProps) => {
    const secondsLeft = Math.max(expireTime - nowSeconds, 0);
    const days = Math.floor(secondsLeft / SECONDS_PER_DAY);
    const hoursOfDay = Math.floor((secondsLeft % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    const hours = days > 0 ? hoursOfDay : Math.max(hoursOfDay, 1);

    const getTranslationId = () => {
        if (days === 0) return 'earn.tron.unstakingCard.readyInHours';
        if (hours === 0) return 'earn.tron.unstakingCard.readyInDays';

        return 'earn.tron.unstakingCard.readyInDaysAndHours';
    };

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="sp16"
            paddingVertical="sp12"
            spacing="sp16"
            testID={`@staking/tron-unstaking-card/row-${index}`}
        >
            <Text variant="body-sm" color="contentSecondary">
                <Translation id={getTranslationId()} values={{ days, hours }} />
            </Text>
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
