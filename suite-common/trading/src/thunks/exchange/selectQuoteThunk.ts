import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import {
    selectTradingExchangeInfo,
    selectTradingExchangeQuotesRequest,
} from '../../selectors/tradingSelectors';

type UserConsentProps = {
    provider: string;
    isDex: boolean;
    send: string;
    receive: string;
};

export type SelectQuoteThunkProps = {
    quote: ExchangeTrade;
    timer: Timer;

    userConsent: ({ provider, isDex, send, receive }: UserConsentProps) => Promise<boolean>;
    nextStep: () => void;
};

export const selectQuoteThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/selectQuote`,
    async (
        { quote, timer, userConsent, nextStep }: SelectQuoteThunkProps,
        { dispatch, getState },
    ) => {
        const exchangeInfo = selectTradingExchangeInfo(getState());
        const quotesRequest = selectTradingExchangeQuotesRequest(getState());
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;

        if (!quotesRequest || !provider || !quote.send || !quote.receive) {
            return;
        }

        const result = await userConsent({
            provider: provider.companyName,
            isDex: !!quote.isDex,
            send: quote.send,
            receive: quote.receive,
        });

        if (!result) {
            return;
        }

        dispatch(tradingExchangeActions.saveSelectedQuote(quote));
        timer.stop();
        nextStep();
    },
);
