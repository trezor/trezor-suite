import { Translation } from '@suite/intl';
import { getFiatCurrencyFlag } from '@suite-common/flags';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Column, Flag, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { type TradingPayGetLabelType } from 'src/types/trading/trading';

type TradingDetailFiatRowProps = {
    label: TradingPayGetLabelType;
    currency?: string;
    amount?: string;
};

export const TradingDetailFiatRow = ({ label, currency, amount }: TradingDetailFiatRowProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (!currency) {
        return null;
    }

    const hasAmount = !!amount && amount.trim() !== '';
    const flag = getFiatCurrencyFlag(currency);
    const formatterOptions = {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: isFiatBaseCurrencyCode(currency)
            ? getDecimalsForBaseCurrency({ code: currency, isInSats: false })
            : undefined,
    } as const;

    return (
        <Column width="100%" gap={8}>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id={label} />
            </Text>
            <Row gap={8} justifyContent="space-between">
                <Row gap={8} alignItems="center">
                    {flag && <Flag country={flag} size={40} />}
                    <Text data-testid="@trading/form/info/fiat-currency">
                        {currency.toUpperCase()}
                    </Text>
                </Row>
                {hasAmount && (
                    <Text
                        typographyStyle="body-md-strong"
                        as="div"
                        data-testid="@trading/form/info/fiat-amount"
                    >
                        <HiddenPlaceholder>
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(amount))}
                                currency={currency}
                                {...formatterOptions}
                            />
                        </HiddenPlaceholder>
                    </Text>
                )}
            </Row>
        </Column>
    );
};
