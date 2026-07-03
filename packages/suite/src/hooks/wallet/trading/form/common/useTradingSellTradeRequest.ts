import type { SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import {
    selectTradingComposedTransactionInfo,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    sellThunks,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

export const useTradingSellTradeRequest = (account: Account | undefined) => {
    const dispatch = useDispatch();
    const sellInfo = useSelector(selectTradingSellInfo);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const { selectedFee, composed } = useSelector(selectTradingComposedTransactionInfo);

    const getTradeRequestParams = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider || !account) return;

        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;

        const returnUrl = await createQuoteLink(
            {
                ...quotesRequest,
                country: quotesRequest.country ?? quote.country,
                fiatCurrency: quotesRequest.fiatCurrency ?? quote.fiatCurrency,
                amountInCrypto: quotesRequest.amountInCrypto ?? quote.amountInCrypto,
                cryptoStringAmount: quotesRequest.cryptoStringAmount ?? quote.cryptoStringAmount,
                fiatStringAmount: quotesRequest.fiatStringAmount ?? quote.fiatStringAmount,
                cryptoCurrency: quotesRequest.cryptoCurrency ?? quote.cryptoCurrency,
                paymentMethod: quote.paymentMethod,
            },
            account,
            { selectedFee, composed },
            orderId,
        );

        const processResponseData = (response: SellFiatTradeResponse) => {
            dispatch(submitRequestForm(response.tradeForm?.form));
        };

        return {
            returnUrl,
            processResponseData,
        };
    };

    const handleSellTrade = async (trade: SellFiatTrade) => {
        if (!account) return { isRedirecting: false };

        const tradeRequestParams = await getTradeRequestParams(trade);

        if (!tradeRequestParams) return { isRedirecting: false };

        const { returnUrl, processResponseData } = tradeRequestParams;

        let isRedirecting = false;

        await dispatch(
            sellThunks.handleTradeThunk({
                account,
                trade,
                returnUrl,
                processResponseData: response => {
                    isRedirecting = true;
                    processResponseData(response);
                },
            }),
        );

        return { isRedirecting };
    };

    return { getTradeRequestParams, handleSellTrade };
};
