import { selectLanguage } from '@suite/settings';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/discreet-mode';
import { useCurrencyAmountParts } from '@suite-common/formatters';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite';

type FiatAmountHeadlineProps = {
    fiatValue: BigNumber;
    isExact?: boolean;
    'data-testid'?: string;
};

export const FiatAmountHeadline = ({
    fiatValue,
    isExact,
    'data-testid': dataTestId,
}: FiatAmountHeadlineProps) => {
    const locale = useSelector(selectLanguage);
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });

    const {
        currencySymbol,
        currencySymbolSeparator,
        wholeNumber,
        decimalNumber,
        isCurrencySymbolFirst,
    } = useCurrencyAmountParts({ value: fiatValue.toFixed(), locale, isExact });

    // The space goes inside the symbol's text: on its own between the row's items it would collapse.
    const symbol = (
        <Text typographyStyle="headline-lg" color="contentTertiary">
            {isCurrencySymbolFirst
                ? `${currencySymbol}${currencySymbolSeparator}`
                : `${currencySymbolSeparator}${currencySymbol}`}
        </Text>
    );

    // Tabular digits drop the headline's negative tracking, which ran adjacent zeros into each other.
    return (
        <Row alignItems="baseline" data-testid={dataTestId}>
            {isCurrencySymbolFirst && symbol}
            <Text typographyStyle="headline-lg" isTabular>
                {shouldRedactNumbers ? redactNumericalSubstring(wholeNumber) : wholeNumber}
            </Text>
            {!shouldRedactNumbers && decimalNumber !== '' && (
                <Text typographyStyle="headline-lg" color="contentTertiary" isTabular>
                    {decimalNumber}
                </Text>
            )}
            {!isCurrencySymbolFirst && symbol}
        </Row>
    );
};
