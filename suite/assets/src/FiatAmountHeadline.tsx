import { useSelector } from 'react-redux';

import { selectLanguage } from '@suite/settings';
import { useCurrencyAmountParts } from '@suite-common/formatters';
import { Row, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';
import { type BigNumber } from '@trezor/utils';

type FiatAmountHeadlineProps = {
    fiatValue: BigNumber;
    isExact?: boolean;
    typographyStyle?: TypographyStyle;
    'data-testid'?: string;
};

export const FiatAmountHeadline = ({
    fiatValue,
    isExact,
    typographyStyle = 'headline-lg',
    'data-testid': dataTestId,
}: FiatAmountHeadlineProps) => {
    const locale = useSelector(selectLanguage);

    // Redacts the numbers itself in discreet mode.
    const {
        currencySymbol,
        currencySymbolSeparator,
        wholeNumber,
        decimalNumber,
        isCurrencySymbolFirst,
    } = useCurrencyAmountParts({ value: fiatValue.toFixed(), locale, isExact });

    // The space goes inside the symbol's text: on its own between the row's items it would collapse.
    const symbol = (
        <Text typographyStyle={typographyStyle} color="contentTertiary">
            {isCurrencySymbolFirst
                ? `${currencySymbol}${currencySymbolSeparator}`
                : `${currencySymbolSeparator}${currencySymbol}`}
        </Text>
    );

    // Tabular digits drop the headline's negative tracking, which ran adjacent zeros into each other.
    return (
        <Row alignItems="baseline" data-testid={dataTestId}>
            {isCurrencySymbolFirst && symbol}
            <Text typographyStyle={typographyStyle} isTabular>
                {wholeNumber}
            </Text>
            {decimalNumber !== '' && (
                <Text typographyStyle={typographyStyle} color="contentTertiary" isTabular>
                    {decimalNumber}
                </Text>
            )}
            {!isCurrencySymbolFirst && symbol}
        </Row>
    );
};
