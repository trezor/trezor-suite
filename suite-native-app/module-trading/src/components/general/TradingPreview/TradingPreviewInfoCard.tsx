import type { ReactNode } from 'react';

import type { BuyTrade, SellFiatTrade } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import type { TradingType } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { PaymentMethodDisplay, TradeInfoRow } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

import { ProviderInfoRow } from '../TradeInfo/ProviderInfoRow';

export type TradingPreviewInfoCardProps = {
    quote: BuyTrade | SellFiatTrade;
    tradingType: Extract<TradingType, 'buy' | 'sell'>;
    fiatAmountLabel: ReactNode;
    feeRow?: ReactNode;
};

export const TradingPreviewInfoCard = ({
    quote,
    tradingType,
    fiatAmountLabel,
    feeRow,
}: TradingPreviewInfoCardProps) => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Card noPadding>
            <TradeInfoRow noBorder>
                <Text variant="body-sm" color="contentSecondary">
                    {fiatAmountLabel}
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
                    {translate('moduleTrading.tradingScreen.paymentMethod')}
                </Text>
                <PaymentMethodDisplay
                    paymentMethod={quote.paymentMethod}
                    paymentMethodName={quote.paymentMethodName}
                    accessibilityLabel={translate(
                        'moduleTrading.tradingScreen.selectedPaymentMethod',
                    )}
                />
            </TradeInfoRow>
            <ProviderInfoRow exchange={quote.exchange} tradingType={tradingType} />
            {feeRow && (
                <TradeInfoRow noHorizontalPadding noVerticalPadding>
                    {feeRow}
                </TradeInfoRow>
            )}
        </Card>
    );
};
