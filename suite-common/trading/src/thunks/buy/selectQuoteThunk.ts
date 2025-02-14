import { BuyTrade, FormResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Timer } from '@trezor/react-utils';

import { tradingBuyActions } from '../../actions/buyActions';
import { invityAPI } from '../../invityAPI';
import {
    cryptoIdToCoinSymbol,
    selectTradingBuyInfo,
    selectTradingBuyQuotesRequest,
} from '../../selectors/tradingSelectors';

import { BUY_THUNK_COMMON_PREFIX } from './';

export type SelectQuoteThunk = {
    quote: BuyTrade;
    timer: Timer;
    returnUrl: string;

    loginRequest: (form: FormResponse['form']) => void;
    userConsent: (provider: string, cryptoCurrency: string) => Promise<boolean>;
    nextStep: () => void;
};

export const selectQuoteThunk = createThunk(
    `${BUY_THUNK_COMMON_PREFIX}/selectQuote`,
    async (
        { quote, returnUrl, timer, loginRequest, userConsent, nextStep }: SelectQuoteThunk,
        { dispatch, getState },
    ) => {
        const buyInfo = selectTradingBuyInfo(getState());
        const quotesRequest = selectTradingBuyQuotesRequest(getState());

        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !quote.receiveCurrency || !provider) return;

        // consent to continue (modal)
        const result = await userConsent(
            provider.name,
            cryptoIdToCoinSymbol(getState(), quote.receiveCurrency),
        );

        if (!result) return;

        // empty quoteId means the partner requests login first, requestTrade to get login screen
        if (!quote.quoteId) {
            const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });

            if (!response) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'No response from the server',
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
