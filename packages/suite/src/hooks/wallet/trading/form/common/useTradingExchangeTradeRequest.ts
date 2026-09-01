import type { ExchangeTrade } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    selectTradingComposedTransactionInfo,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useSelector } from 'src/hooks/suite';
import { createQuoteLink } from 'src/utils/wallet/trading/exchangeUtils';

export const useTradingExchangeTradeRequest = (account: Account | undefined) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const { selectedFee, composed } = useSelector(selectTradingComposedTransactionInfo);

    const getTradeRequestParams = async (trade?: ExchangeTrade) => {
        const quoteId = trade?.quoteId ?? selectedQuote?.quoteId;

        if (!quotesRequest || !quoteId || !account) {
            return;
        }

        const returnUrl = await createQuoteLink(
            quotesRequest,
            account,
            { selectedFee, composed },
            quoteId,
        );

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: 'exchange' },
            });
        };

        const processResponseData = (response: ExchangeTrade) => {
            dispatch(submitRequestForm(response.tradeForm?.form));
        };

        const nextStep = () => {
            dispatch(goto({ routeName: 'wallet-trading-exchange-detail' }));
        };

        return {
            returnUrl,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        };
    };

    return { getTradeRequestParams };
};
