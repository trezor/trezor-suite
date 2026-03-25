import { useSelector } from 'react-redux';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { useExchangeFiatDeviation } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

type TradingFiatDeviationWarningProps = {
    selectedQuote: ExchangeTrade;
};

export const TradingFiatDeviationWarning = ({
    selectedQuote,
}: TradingFiatDeviationWarningProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const exchangeDeviation = useExchangeFiatDeviation({
        sendCryptoId: selectedQuote.send,
        sendAmount: selectedQuote.sendStringAmount,
        receiveCryptoId: selectedQuote.receive,
        receiveAmount: selectedQuote.receiveStringAmount,
        fiatCurrency,
    });

    if (!exchangeDeviation?.exceedsThreshold) return null;

    return (
        <Banner
            intent={exchangeDeviation.exceedsHighThreshold ? 'critical' : 'warning'}
            data-testid="@trading/fiat-deviation-warning"
            description={
                <Translation
                    id="TR_TRADING_FIAT_DEVIATION_WARNING"
                    values={{
                        percentage: exchangeDeviation.deviation,
                    }}
                />
            }
        />
    );
};
