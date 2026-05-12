import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeInfo } from '../../selectors/tradingSelectors';
import { requiresTokenApproval } from '../../utils/exchange/exchangeUtils';

export type SelectExchangeQuoteThunkProps = {
    quote: ExchangeTrade;
    nextStep: () => void;
};

export const selectExchangeQuoteThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/selectQuote`,
    ({ quote, nextStep }: SelectExchangeQuoteThunkProps, { dispatch, getState }) => {
        const exchangeInfo = selectTradingExchangeInfo(getState());
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;

        if (!provider || !quote.send || !quote.receive) {
            return;
        }

        // DEX ERC-20 swaps use preselectedQuote on approval screens until CONFIRM / SIGN_DATA.
        // Native / no-approval DEX goes straight to preview and must be persisted as selectedQuote.
        if (
            !quote.isDex ||
            quote.status === 'CONFIRM' ||
            quote.status === 'SIGN_DATA' ||
            !requiresTokenApproval(quote)
        ) {
            dispatch(tradingExchangeActions.saveSelectedQuote(quote));
        }

        dispatch(tradingActions.stopRefetchQuotes());
        nextStep();
    },
);
