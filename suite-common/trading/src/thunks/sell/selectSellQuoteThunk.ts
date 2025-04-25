import { SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import {
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
} from '../../selectors/tradingSelectors';
import { TradingSellUserConsentProps } from '../../types';

export type SelectSellQuoteThunkProps = {
    quote: SellFiatTrade;
    timer: Timer;

    userConsent: ({ provider, cryptoCurrency }: TradingSellUserConsentProps) => Promise<boolean>;
    nextStep: () => void;
    onCancel?: () => void;
};

export const selectSellQuoteThunk = createThunk(
    `${TRADING_SELL_THUNK_PREFIX}/selectQuote`,
    async (
        { quote, timer, userConsent, nextStep, onCancel }: SelectSellQuoteThunkProps,
        { dispatch, getState },
    ) => {
        const sellInfo = selectTradingSellInfo(getState());
        const quotesRequest = selectTradingSellQuotesRequest(getState());
        const provider = quote.exchange ? sellInfo?.providerInfos[quote.exchange] : undefined;

        if (!quotesRequest || !provider || !quote.cryptoCurrency) return;

        const result = await userConsent({
            provider: provider.companyName,
            cryptoCurrency: quote.cryptoCurrency,
        });

        if (!result) {
            onCancel?.();

            return;
        }

        dispatch(tradingSellActions.saveSelectedQuote(quote));
        timer.stop();
        nextStep();
    },
);
