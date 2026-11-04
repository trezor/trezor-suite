import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type ExchangeTrade } from 'invity-api';

import {
    type TradingExchangeFormProps,
    type TradingExchangeType,
    type TradingRootState,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';

import { useTradingFormContext } from './useTradingCommonForm';

type GetTradingExchangeCryptoInfoParams = {
    values: Partial<
        Pick<TradingExchangeFormProps, 'sendCryptoSelect' | 'receiveCryptoSelect' | 'selectedFee'>
    >;
    quoteExchange: ExchangeTrade['exchange'];
    exchangeProviders: ReturnType<typeof selectTradingExchangeProviders>;
};

export const getTradingExchangeCryptoInfo = ({
    values: { sendCryptoSelect, receiveCryptoSelect, selectedFee },
    quoteExchange,
    exchangeProviders,
}: GetTradingExchangeCryptoInfoParams) => {
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
};

export const useTradingExchangeCryptoAndProviderInfo = () => {
    const { getValues } = useTradingFormContext<TradingExchangeType>();
    const quoteExchange = useSelector(
        (state: TradingRootState) => selectTradingExchangeSelectedQuote(state)?.exchange,
    );
    const exchangeProviders = useSelector(selectTradingExchangeProviders);

    const getCryptoInfo = useCallback(
        () =>
            getTradingExchangeCryptoInfo({
                values: getValues(),
                quoteExchange,
                exchangeProviders,
            }),
        [getValues, quoteExchange, exchangeProviders],
    );

    return getCryptoInfo;
};

export type GetTradingExchangeCryptoInfo = ReturnType<
    typeof useTradingExchangeCryptoAndProviderInfo
>;
