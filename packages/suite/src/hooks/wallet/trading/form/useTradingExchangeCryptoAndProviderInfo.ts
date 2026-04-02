import { useCallback } from 'react';

import { useTradingExchangeFormContext } from 'src/views/wallet/trading/exchange/TradingExchangeContext';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { selectedQuote, preselectedQuote, exchangeInfo, getValues } =
        useTradingExchangeFormContext();

    const getCryptoInfo = useCallback(() => {
        const { sendCryptoSelect, receiveCryptoSelect, selectedFee } = getValues();

        const quoteExchange = preselectedQuote?.exchange ?? selectedQuote?.exchange;
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
    }, [
        getValues,
        preselectedQuote?.exchange,
        selectedQuote?.exchange,
        exchangeInfo?.providerInfos,
    ]);

    return getCryptoInfo;
};
