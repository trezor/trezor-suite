import { useCallback } from 'react';

import { useSelector } from '@suite-common/redux-utils';
import {
    type TradingExchangeType,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';

import { useTradingFormContext } from './useTradingCommonForm';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { getValues } = useTradingFormContext<TradingExchangeType>();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const exchangeProviders = useSelector(selectTradingExchangeProviders);

    const getCryptoInfo = useCallback(() => {
        const { sendCryptoSelect, receiveCryptoSelect, selectedFee } = getValues();

        const quoteExchange = selectedQuote?.exchange;
        const quoteProviderName = quoteExchange && exchangeProviders?.[quoteExchange]?.companyName;

        return {
            sendCryptoLabel: sendCryptoSelect?.displaySymbol,
            sendCryptoNetworkSymbol: sendCryptoSelect?.networkSymbol,
            sendCryptoContractAddress: sendCryptoSelect?.contractAddress ?? undefined,

            receiveCryptoLabel: receiveCryptoSelect?.displaySymbol,
            receiveCryptoNetworkSymbol: receiveCryptoSelect?.networkSymbol,
            receiveCryptoContractAddress: receiveCryptoSelect?.contractAddress ?? undefined,

            exchangeName: quoteProviderName,
            selectedFee,
        };
    }, [getValues, selectedQuote?.exchange, exchangeProviders]);

    return getCryptoInfo;
};
