import { BuyTrade, FormResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Timer } from '@trezor/react-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import {
    selectTradingBuyInfo,
    selectTradingBuyQuotesRequest,
    selectTradingCoinSymbolByCryptoId,
} from '../../selectors/tradingSelectors';

export type SelectQuoteThunkProps = {
    quote: BuyTrade;
    timer: Timer;
    returnUrl: string;

    loginRequest: (form: FormResponse['form']) => void;
    userConsent: (provider: string, cryptoCurrency: string) => Promise<boolean>;
    nextStep: () => void;
};

export const selectQuoteThunk = createThunk(
    `${TRADING_BUY_THUNK_PREFIX}/selectQuote`,
    async (
        { quote, returnUrl, timer, loginRequest, userConsent, nextStep }: SelectQuoteThunkProps,
        { dispatch, getState },
    ) => {
        const buyInfo = selectTradingBuyInfo(getState());
        const quotesRequest = selectTradingBuyQuotesRequest(getState());

        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !quote.receiveCurrency || !provider) return;

        // consent to continue (modal)
        const result = await userConsent(
            provider.name,
            selectTradingCoinSymbolByCryptoId(getState(), quote.receiveCurrency) ?? 'unknown',
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
