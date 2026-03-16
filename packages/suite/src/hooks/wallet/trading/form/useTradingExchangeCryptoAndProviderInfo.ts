import { useCallback } from 'react';

import { type TradingExchangeType } from '@suite-common/trading';

import { useTradingFormContext } from './useTradingCommonForm';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { selectedQuote, preselectedQuote, exchangeInfo, getValues } =
        useTradingFormContext<TradingExchangeType>();

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
