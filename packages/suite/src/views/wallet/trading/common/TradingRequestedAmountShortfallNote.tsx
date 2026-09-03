import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useFormatters } from '@suite-common/formatters';
import {
    type TradingTradeType,
    isBuyTrade,
    isSellFiatTrade,
    useFormatCryptoValue,
    useTradingRequestedAmountShortfall,
} from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { localizePercentage } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

type TradingRequestedAmountShortfallNoteProps = {
    quote: TradingTradeType;
};

export const TradingRequestedAmountShortfallNote = ({
    quote,
}: TradingRequestedAmountShortfallNoteProps) => {
    const language = useSelector(selectLanguage);
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

    const formattedShortfallRatio = localizePercentage({
        valueInFraction: shortfall.shortfallRatio,
        locale: language,
    });

    return (
        <Text
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            data-testid="@trading/quote/shortfall-note"
        >
            <Translation
                id="TR_TRADING_LESS_TO_RECEIVE_THAN_REQUESTED"
                values={{ percent: formattedShortfallRatio, amount: formattedShortfall }}
            />
        </Text>
    );
};
