import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { HStack, Text, type TextProps } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation, selectLocale } from '@suite-native/intl';

const PERCENTAGE_DECIMAL_PLACES = 2;
const MIN_VALUE_CHANGE_DECIMAL_PLACES = 2;

const roundPercentageChangeForDisplay = (percentageChange: number) =>
    Number(percentageChange.toFixed(PERCENTAGE_DECIMAL_PLACES + 2));

const getChangeColor = (change: number): NonNullable<TextProps['color']> => {
    if (change === 0) return 'contentSecondary';

    return change > 0 ? 'contentBrand' : 'contentCritical';
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
    // Cents would round the change of a low-priced asset down to zero.
    const valueChangeDecimalPlaces = Math.max(
        MIN_VALUE_CHANGE_DECIMAL_PLACES,
        absoluteValueChange?.decimalPlaces() ?? 0,
    );
    const textColor = getChangeColor(displayedPercentageChange);
    // The percentage can round to zero while the amount, shown with every decimal, does not.
    const valueChangeSign = valueChange?.comparedTo(0) ?? 0;
    const valueChangeColor = getChangeColor(valueChangeSign);

    return (
        <HStack spacing="sp12">
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="assets.priceChangePeriod" />
            </Text>

            {absoluteValueChange !== null && absoluteValueChange !== undefined && (
                <HStack spacing={0}>
                    {valueChangeSign !== 0 && (
                        <Text variant="body-sm" color={valueChangeColor}>
                            <SignValueFormatter value={valueChangeSign} />
                        </Text>
                    )}
                    <BaseCurrencyAmountFormatter
                        value={absoluteValueChange}
                        maximumFractionDigits={valueChangeDecimalPlaces}
                        variant="body-sm"
                        color={valueChangeColor}
                        // This is a public market-price change, not a wallet balance.
                        discreetMode="disabled"
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
