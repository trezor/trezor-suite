import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { useExchangeFiatDeviation } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, selectLocale } from '@suite-native/intl';

export type ExchangeFiatDeviationWarningProps = {
    quote?: ExchangeTrade;
};

export const ExchangeFiatDeviationWarning = ({ quote }: ExchangeFiatDeviationWarningProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const locale = useSelector(selectLocale);
    const exchangeDeviation = useExchangeFiatDeviation({
        fiatCurrency,
        receiveAmount: quote?.receiveStringAmount,
        receiveCryptoId: quote?.receive,
        sendAmount: quote?.sendStringAmount,
        sendCryptoId: quote?.send,
    });

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 0,
            }),
        [locale],
    );

    if (!quote || !exchangeDeviation || !exchangeDeviation.exceedsThreshold) {
        return null;
    }

    const percent = percentFormatter.format(exchangeDeviation.deviation);

    return (
        <InlineAlertBox
            title={
                <Translation
                    id="moduleTrading.tradingExchangePreviewScreen.fiatDeviationWarning"
                    values={{ percent }}
                />
            }
            iconName={exchangeDeviation.exceedsHighThreshold ? 'warningCircle' : 'warning'}
            variant={exchangeDeviation.exceedsHighThreshold ? 'critical' : 'warning'}
        />
    );
};
