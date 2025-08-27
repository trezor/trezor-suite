import { useMemo } from 'react';

import { TradingExchangeType } from '@suite-common/trading';

import { getTradingCryptoInfo } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingFormContext } from './useTradingCommonForm';

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { selectedQuote, preselectedQuote, exchangeInfo, getValues } =
        useTradingFormContext<TradingExchangeType>();
    const { sendCryptoSelect, receiveCryptoSelect, selectedFee } = getValues();

    const cryptoInfo = useMemo(() => {
        const {
            label: sendCryptoLabel,
            networkSymbol: sendCryptoNetworkSymbol,
            contractAddress: sendCryptoContractAddress,
        } = getTradingCryptoInfo(sendCryptoSelect);

        const {
            label: receiveCryptoLabel,
            networkSymbol: receiveCryptoNetworkSymbol,
            contractAddress: receiveCryptoContractAddress,
        } = getTradingCryptoInfo(receiveCryptoSelect);

        return {
            sendCryptoLabel,
            sendCryptoNetworkSymbol,
            sendCryptoContractAddress,
            receiveCryptoLabel,
            receiveCryptoNetworkSymbol,
            receiveCryptoContractAddress,
        };
    }, [sendCryptoSelect, receiveCryptoSelect]);

    const providerName = useMemo(() => {
        const quoteExchange = preselectedQuote?.exchange ?? selectedQuote?.exchange;

        return quoteExchange && exchangeInfo?.providerInfos[quoteExchange]?.companyName;
    }, [selectedQuote, preselectedQuote, exchangeInfo]);

    return {
        ...cryptoInfo,
        providerName,
        selectedFee,
    };
};
