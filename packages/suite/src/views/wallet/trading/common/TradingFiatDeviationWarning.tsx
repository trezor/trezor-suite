import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useExchangeFiatDeviation } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

type TradingFiatDeviationWarningProps = {
    selectedQuote: ExchangeTrade;
};

export const TradingFiatDeviationWarning = ({
    selectedQuote,
}: TradingFiatDeviationWarningProps) => {
    const language = useSelector(selectLanguage);
    const fiatCurrency = useSelector(selectBaseCurrency);
    const exchangeDeviation = useExchangeFiatDeviation({
        sendCryptoId: selectedQuote.send,
        sendAmount: selectedQuote.sendStringAmount,
        receiveCryptoId: selectedQuote.receive,
        receiveAmount: selectedQuote.receiveStringAmount,
        fiatCurrency,
    });

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(language, {
                style: 'percent',
                maximumFractionDigits: 0,
            }),
        [language],
    );

    if (!exchangeDeviation?.exceedsThreshold) return null;

    const percentage = percentFormatter.format(exchangeDeviation.deviation);

    return (
        <Banner
            intent={exchangeDeviation.exceedsHighThreshold ? 'critical' : 'warning'}
            data-testid="@trading/fiat-deviation-warning"
            description={
                <Translation id="TR_TRADING_FIAT_DEVIATION_WARNING" values={{ percentage }} />
            }
        />
    );
};
