import { type BuyTrade, type FormResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Timer } from '@trezor/react-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import {
    selectTradingBuyInfo,
    selectTradingBuyQuotesRequest,
} from '../../selectors/tradingSelectors';
import { logErrorThunk } from '../common/logErrorThunk';

export type SelectBuyQuoteThunkProps = {
    quote: BuyTrade;
    timer: Timer;
    returnUrl: string;

    loginRequest: (form: FormResponse['form']) => void;
    nextStep: () => void;
};

export const selectBuyQuoteThunk = createThunk(
    `${TRADING_BUY_THUNK_PREFIX}/selectQuote`,
    async (
        { quote, returnUrl, timer, loginRequest, nextStep }: SelectBuyQuoteThunkProps,
        { dispatch, getState },
    ) => {
        const buyInfo = selectTradingBuyInfo(getState());
        const quotesRequest = selectTradingBuyQuotesRequest(getState());

        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !quote.receiveCurrency || !provider) return;

        // empty quoteId means the partner requests login first, requestTrade to get login screen
        if (!quote.quoteId) {
            const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });

            if (!response) {
                dispatch(
                    logErrorThunk({
                        errorMessage: 'No response from the server',
                        tradingType: 'buy',
                    }),
                );

                return;
            }

            if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                loginRequest(response.tradeForm.form);
            }

            return;
        }

        dispatch(tradingBuyActions.saveSelectedQuote(quote));
        timer.stop();
        nextStep();
    },
);
