import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    type TradingTradeType,
    isBuyTrade,
    isSellFiatTrade,
    useFormatCryptoValue,
    useTradingRequestedAmountShortfall,
} from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation, selectLocale } from '@suite-native/intl';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

export type RequestedAmountShortfallNoteProps = {
    quote: TradingTradeType;
};

export const RequestedAmountShortfallNote = ({ quote }: RequestedAmountShortfallNoteProps) => {
    const locale = useSelector(selectLocale);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formatCryptoValue = useFormatCryptoValue();
    const shortfall = useTradingRequestedAmountShortfall({ quote });

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 1,
            }),
        [locale],
    );

    if (!shortfall) {
        return null;
    }

    const fiatCurrency =
        isBuyTrade(quote) || isSellFiatTrade(quote)
            ? (quote.fiatCurrency?.toLowerCase() as BaseCurrencyCode | undefined)
            : undefined;

    const getFormattedShortfall = () => {
        if (shortfall.cryptoShortfall) {
            return formatCryptoValue(
                shortfall.cryptoShortfall.amount,
                shortfall.cryptoShortfall.cryptoId,
            );
        }

        if (shortfall.fiatShortfall !== undefined && fiatCurrency) {
            return BaseCurrencyAmountFormatter.format(
                asBaseCurrencyAmount(new BigNumber(shortfall.fiatShortfall)),
                { currency: fiatCurrency },
            );
        }

        return undefined;
    };

    const formattedShortfall = getFormattedShortfall();

    if (!formattedShortfall) {
        return null;
    }

    const formattedShortfallRatio = percentFormatter.format(shortfall.shortfallRatio);

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Translation
                id="moduleTrading.providerListItem.lessToReceiveThanRequested"
                values={{ percent: formattedShortfallRatio, amount: formattedShortfall }}
            />
        </Text>
    );
};
