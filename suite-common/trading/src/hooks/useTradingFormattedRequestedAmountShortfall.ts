import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { useFormatCryptoValue } from './useFormatCryptoValue';
import { useTradingRequestedAmountShortfall } from './useTradingRequestedAmountShortfall';
import type { TradingTradeType } from '../types';
import { isBuyTrade, isSellFiatTrade } from '../utils';

type UseTradingFormattedRequestedAmountShortfallProps = {
    quote: TradingTradeType;
};

export type TradingFormattedRequestedAmountShortfall = {
    formattedShortfall: string;
    shortfallRatio: number;
};

export const useTradingFormattedRequestedAmountShortfall = ({
    quote,
}: UseTradingFormattedRequestedAmountShortfallProps): TradingFormattedRequestedAmountShortfall | null => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formatCryptoValue = useFormatCryptoValue();
    const shortfall = useTradingRequestedAmountShortfall({ quote });

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

    return { formattedShortfall, shortfallRatio: shortfall.shortfallRatio };
};
