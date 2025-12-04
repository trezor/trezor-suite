import { useCallback } from 'react';

import { TradingExchangeType } from '@suite-common/trading';

import { getTradingCryptoInfo } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingFormContext } from './useTradingCommonForm';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { selectedQuote, preselectedQuote, exchangeInfo, getValues } =
        useTradingFormContext<TradingExchangeType>();

    const getCryptoInfo = useCallback(() => {
        const { sendCryptoSelect, receiveCryptoSelect, selectedFee } = getValues();

        const quoteExchange = preselectedQuote?.exchange ?? selectedQuote?.exchange;
        const quoteProviderName =
            quoteExchange && exchangeInfo?.providerInfos[quoteExchange]?.companyName;

        const {
            label: sendCryptoLabel,
            networkSymbol: sendCryptoNetworkSymbol,
            contractAddress: sendCryptoContractAddress,
        } = getTradingCryptoInfo(sendCryptoSelect);

        return {
            sendCryptoLabel,
            sendCryptoNetworkSymbol,
            sendCryptoContractAddress,

            receiveCryptoLabel: receiveCryptoSelect?.displaySymbol,
            receiveCryptoNetworkSymbol: receiveCryptoSelect?.networkSymbol,
            receiveCryptoContractAddress: receiveCryptoSelect?.contractAddress ?? undefined,

            providerName: quoteProviderName,
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
