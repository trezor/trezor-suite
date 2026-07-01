import type { BuyTrade } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

import { PaymentMethodPickerValue } from '../../general/PaymentMethodPickerValue';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

export type BuyPreviewInfoCardProps = {
    quote: BuyTrade;
};

export const BuyPreviewInfoCard = ({ quote }: BuyPreviewInfoCardProps) => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Card noPadding>
            <TradeInfoRow noBorder>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.tradingBuyPreviewScreen.youPay" />
                </Text>
                <Text variant="body-sm">
                    {BaseCurrencyAmountFormatter.format(
                        asBaseCurrencyAmount(new BigNumber(quote.fiatStringAmount ?? '0')),
                        { currency: quote.fiatCurrency },
                    )}
                </Text>
            </TradeInfoRow>
            <TradeInfoRow>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.tradingScreen.paymentMethod" />
                </Text>
                <PaymentMethodPickerValue
                    paymentMethod={quote.paymentMethod}
                    paymentMethodName={quote.paymentMethodName}
                    accessibilityLabel={translate(
                        'moduleTrading.tradingScreen.selectedPaymentMethod',
                    )}
                />
            </TradeInfoRow>
            <ProviderInfoRow exchange={quote?.exchange} tradingType="buy" />
        </Card>
    );
};
