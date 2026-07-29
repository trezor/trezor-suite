import { useCallback } from 'react';

import {
    type TradingExchangeType,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

import { useTradingFormContext } from './useTradingCommonForm';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { exchangeInfo, getValues } = useTradingFormContext<TradingExchangeType>();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const getCryptoInfo = useCallback(() => {
        const { sendCryptoSelect, receiveCryptoSelect, selectedFee } = getValues();

        const quoteExchange = selectedQuote?.exchange;
        const quoteProviderName =
            quoteExchange && exchangeInfo?.providerInfos[quoteExchange]?.companyName;

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
    }, [getValues, selectedQuote?.exchange, exchangeInfo?.providerInfos]);

    return getCryptoInfo;
};
