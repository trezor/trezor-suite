import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeDexQuoteApprovalPrefetchLoadingQuoteId,
    selectTradingExchangeQuotes,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { getUnusedAddressFromAccount } from '../../utils';

export type PrefetchDexQuoteApprovalThunkProps = {
    account: Account;
    trade: ExchangeTrade;
};

type PrefetchDexQuoteApprovalThunkState = TradingRootState;

export const prefetchDexQuoteApprovalThunk = createThunk<
    ExchangeTrade | undefined,
    PrefetchDexQuoteApprovalThunkProps,
    { state: PrefetchDexQuoteApprovalThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/prefetchDexQuoteApproval`,
    async ({ trade, account }, { dispatch, getState }) => {
        dispatch(tradingExchangeActions.setDexQuoteApprovalPrefetchLoadingQuoteId(trade?.quoteId));

        try {
            if (!trade?.quoteId) {
                return undefined;
            }

            const { address: fromAddress } = getUnusedAddressFromAccount(account);

            if (!fromAddress && !trade.fromAddress) {
                return undefined;
            }

            const quoteToProcess = trade.fromAddress ? trade : { ...trade, fromAddress };

            const receiveAddress =
                quoteToProcess.receiveAddress ?? quoteToProcess.fromAddress ?? '';

            const response = await tradeApi.doExchangeTrade({
                trade: quoteToProcess,
                receiveAddress,
                refundAddress: fromAddress ?? quoteToProcess.fromAddress ?? '',
                returnUrl: undefined,
                approvalFlow: true,
            });

            if (!response) {
                return undefined;
            }

            const quotes = selectTradingExchangeQuotes(getState());
            if (response.error) {
                return undefined;
            }
            const updatedQuotes = quotes.map(quote =>
                quote.quoteId === quoteToProcess.quoteId ? { ...quote, ...response } : quote,
            );

            dispatch(tradingExchangeActions.saveQuotes(updatedQuotes));

            return response;
        } finally {
            const currentLoadingQuoteId =
                selectTradingExchangeDexQuoteApprovalPrefetchLoadingQuoteId(getState());

            if (currentLoadingQuoteId === trade?.quoteId) {
                dispatch(
                    tradingExchangeActions.setDexQuoteApprovalPrefetchLoadingQuoteId(undefined),
                );
            }
        }
    },
);
