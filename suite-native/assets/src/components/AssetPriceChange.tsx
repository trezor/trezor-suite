import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { HStack, Text, type TextProps } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation, selectLocale } from '@suite-native/intl';

const PERCENTAGE_DECIMAL_PLACES = 2;

const roundPercentageChangeForDisplay = (percentageChange: number) =>
    Number(percentageChange.toFixed(PERCENTAGE_DECIMAL_PLACES + 2));

const getChangeColor = (percentageChange: number): NonNullable<TextProps['color']> => {
    if (percentageChange === 0) return 'contentSecondary';

    return percentageChange > 0 ? 'contentBrand' : 'contentCritical';
};

type AssetPriceChangeProps = {
    valueChange?: BaseCurrencyAmount | null;
    percentageChange: number | null;
};

export const AssetPriceChange = ({ valueChange, percentageChange }: AssetPriceChangeProps) => {
    const locale = useSelector(selectLocale);
    const { SignValueFormatter } = useFormatters();
    const displayedPercentageChange = roundPercentageChangeForDisplay(percentageChange ?? 0);
    const formattedPercentageChange = localizePercentage({
        valueInFraction: Math.abs(displayedPercentageChange),
        locale,
        numDecimals: PERCENTAGE_DECIMAL_PLACES,
    });
    const absoluteValueChange = valueChange ? asBaseCurrencyAmount(valueChange.abs()) : valueChange;
    const textColor = getChangeColor(displayedPercentageChange);

    return (
        <HStack spacing="sp12">
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="assets.priceChangePeriod" />
            </Text>

            {absoluteValueChange !== null && absoluteValueChange !== undefined && (
                <HStack spacing={0}>
                    {displayedPercentageChange !== 0 && (
                        <Text variant="body-sm" color={textColor}>
                            <SignValueFormatter value={displayedPercentageChange} />
                        </Text>
                    )}
                    <BaseCurrencyAmountFormatter
                        value={absoluteValueChange}
                        variant="body-sm"
                        color={textColor}
                        isDiscreetText={false}
                    />
                </HStack>
            )}

            <Text variant="body-sm" priority="primary" color={textColor}>
                <SignValueFormatter value={displayedPercentageChange} />
                {formattedPercentageChange}
            </Text>
        </HStack>
    );
};
