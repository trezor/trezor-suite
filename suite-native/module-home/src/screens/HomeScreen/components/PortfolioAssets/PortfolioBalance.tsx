import { useSelector } from 'react-redux';

import { Box, DiscreetText, DiscreetTextTrigger, HStack, Text } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import {
    BaseCurrencyAmount,
    EmptyAmountSkeleton,
    type FormattedBaseCurrencyAmount,
} from '@suite-native/formatters';

type PortfolioBalanceContentProps = FormattedBaseCurrencyAmount;

const PortfolioBalanceContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
}: PortfolioBalanceContentProps) => {
    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <DiscreetText variant="headline-md">{wholeNumber}</DiscreetText>
            <DiscreetText variant="headline-md" color="contentSecondary">
                {decimalNumber}
            </DiscreetText>
        </Box>
    );

    const currencyElement = (
        <Text variant="headline-md" color="contentSecondary">
            {currencySymbol}
        </Text>
    );

    return isCryptoCurrency ? (
        <HStack spacing="sp8" alignItems="flex-end">
            {valueElement}
            {currencyElement}
        </HStack>
    ) : (
        <HStack spacing={0} alignItems="flex-end">
            {currencyElement}
            {valueElement}
        </HStack>
    );
};

export const PortfolioBalance = () => {
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    if (totalFiatBalance === undefined) {
        return <EmptyAmountSkeleton variant="headline-md" />;
    }

    return (
        <DiscreetTextTrigger testID="@home/portfolio-assets/total-balance">
            <BaseCurrencyAmount value={totalFiatBalance}>
                {formattedAmount => <PortfolioBalanceContent {...formattedAmount} />}
            </BaseCurrencyAmount>
        </DiscreetTextTrigger>
    );
};
