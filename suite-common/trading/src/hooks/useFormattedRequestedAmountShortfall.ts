import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { type TradingTradeType } from '../types';
import { isBuyTrade, isSellFiatTrade } from '../utils';
import { useFormatCryptoValue } from './useFormatCryptoValue';
import { useTradingRequestedAmountShortfall } from './useTradingRequestedAmountShortfall';

type UseFormattedRequestedAmountShortfallProps = {
    quote: TradingTradeType | undefined;
};

export const useFormattedRequestedAmountShortfall = ({
    quote,
}: UseFormattedRequestedAmountShortfallProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formatCryptoValue = useFormatCryptoValue();
    const shortfall = useTradingRequestedAmountShortfall({ quote });

    const fiatCurrency =
        quote && (isBuyTrade(quote) || isSellFiatTrade(quote))
            ? (quote.fiatCurrency?.toLowerCase() as BaseCurrencyCode | undefined)
            : undefined;

    const formattedShortfall = (() => {
        if (!shortfall) {
            return undefined;
        }

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
    })();

    return { shortfall, formattedShortfall };
};
