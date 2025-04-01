import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import {
    selectTradingExchangeInfo,
    selectTradingExchangeQuotesRequest,
} from '../../selectors/tradingSelectors';
import { TradingExchangeUserConsentProps } from '../../types';

export type SelectQuoteThunkProps = {
    quote: ExchangeTrade;
    timer: Timer;

    userConsent: ({
        provider,
        isDex,
        send,
        receive,
    }: TradingExchangeUserConsentProps) => Promise<boolean>;
    nextStep: () => void;
    onCancel?: () => void;
};

export const selectQuoteThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/selectQuote`,
    async (
        { quote, timer, userConsent, nextStep, onCancel }: SelectQuoteThunkProps,
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
            onCancel?.();

            return;
        }

        dispatch(tradingExchangeActions.saveSelectedQuote(quote));
        timer.stop();
        nextStep();
    },
);
