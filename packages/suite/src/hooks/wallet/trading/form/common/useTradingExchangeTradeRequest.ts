import type { ExchangeTrade } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    selectTradingComposedTransactionInfo,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { selectDesktopApiDep } from '@trezor/suite-desktop-api';

import { submitRequestFormThunk } from 'src/actions/wallet/trading/tradingCommonActions';
import { useSelector } from 'src/hooks/suite';
import { createQuoteLink } from 'src/utils/wallet/trading/exchangeUtils';

export const useTradingExchangeTradeRequest = (account: Account | undefined) => {
    const { desktopApi, analytics, dispatch } = useServices(
        selectDesktopApiDep,
        selectDesktopAnalyticsDep,
        selectDispatch,
    );
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const { selectedFee, composed } = useSelector(selectTradingComposedTransactionInfo);

    const getTradeRequestParams = async (trade?: ExchangeTrade) => {
        const quoteId = trade?.quoteId ?? selectedQuote?.quoteId;

        if (!quotesRequest || !quoteId || !account) {
            return;
        }

        const returnUrl = await createQuoteLink(
            { desktopApi },
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
            dispatch(submitRequestFormThunk(response.tradeForm?.form));
        };

        const nextStep = () => {
            dispatch(gotoThunk({ routeName: 'wallet-trading-exchange-detail' }));
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
