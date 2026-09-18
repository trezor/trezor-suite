import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

/** Locales that separate the decimals with a point; the rest of them use a comma. */
const DECIMAL_POINT_LOCALES = ['en-US', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'];

// The only thing here the design system has no prop for: digits of one width, so the amount does
// not jitter as the rates tick.
const TabularNumbers = styled.span`
    font-variant-numeric: tabular-nums;
`;

type AssetFirstTotalBalanceProps = {
    fiatValue: BigNumber;
};

/**
 * How much there is, in full: the whole of it, and in the grey the rest of the card is written in,
 * what the currency is and what is left over. All of it the same size.
 */
export const AssetFirstTotalBalance = ({ fiatValue }: AssetFirstTotalBalanceProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const language = useSelector(selectLanguage);

    const formatted = BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(fiatValue)) ?? '';
    const separator = DECIMAL_POINT_LOCALES.includes(language) ? '.' : ',';

    // Whatever a locale puts before the first digit is the currency, and whatever follows the last
    // separator is the change — both of them the quiet half of the amount.
    const firstDigitAt = formatted.search(/\d/);
    const currency = firstDigitAt === -1 ? '' : formatted.slice(0, firstDigitAt);
    const amount = firstDigitAt === -1 ? formatted : formatted.slice(firstDigitAt);
    const separatorAt = amount.lastIndexOf(separator);
    const whole = separatorAt === -1 ? amount : amount.slice(0, separatorAt);
    const decimals = separatorAt === -1 ? '' : amount.slice(separatorAt);

    return (
        <Row alignItems="baseline" data-testid="@dashboard/asset-first/fiat-amount">
            {currency !== '' && (
                <Text typographyStyle="headline-lg" color="contentTertiary">
                    {currency}
                </Text>
            )}
            <Text typographyStyle="headline-lg">
                <TabularNumbers>{whole}</TabularNumbers>
            </Text>
            {decimals !== '' && (
                <Text typographyStyle="headline-lg" color="contentTertiary">
                    <TabularNumbers>{decimals}</TabularNumbers>
                </Text>
            )}
        </Row>
    );
};
