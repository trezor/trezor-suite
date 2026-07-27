import { type SellFiatTrade, type SellFiatTradeResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingSellInfo } from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';
import { logErrorThunk } from '../common/logErrorThunk';

export type HandleSellTradeThunkProps = {
    account: Account;
    trade: SellFiatTrade;
    returnUrl: string;

    processResponseData: (response: SellFiatTradeResponse) => void;
};

export const handleSellTradeThunk = createThunk(
    `${TRADING_SELL_THUNK_PREFIX}/handleTrade`,
    async (
        { account, trade, returnUrl, processResponseData }: HandleSellTradeThunkProps,
        { dispatch, getState, fulfillWithValue },
    ) => {
        const sellInfo = selectTradingSellInfo(getState());

        const provider =
            sellInfo?.providerInfos && trade.exchange
                ? sellInfo.providerInfos[trade.exchange]
                : undefined;

        if (!provider) {
            console.warn('doSellTrade: No provider found');

            return;
        }

        const response = await invityAPI.doSellTrade({
            trade: { ...trade, refundAddress: getUnusedAddressFromAccount(account).address },
            returnUrl,
        });

        if (!response.trade) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'No response from the server',
                    tradingType: 'sell',
                }),
            );

            return;
        }

        if (response.trade.error && response.trade.status !== 'LOGIN_REQUEST') {
            dispatch(
                logErrorThunk({
                    errorMessage: response.trade.error,
                    tradingType: 'sell',
                }),
            );

            return;
        }

        const shouldHandledAdditionalOperation =
            response.trade.status === 'LOGIN_REQUEST' ||
            response.trade.status === 'SITE_ACTION_REQUEST' ||
            (response.trade.status === 'SUBMITTED' && provider.flow === 'PAYMENT_GATE');

        if (!shouldHandledAdditionalOperation) {
            return fulfillWithValue(response.trade);
        }

        if (provider.flow === 'PAYMENT_GATE') {
            dispatch(
                tradingActions.saveTrade({
                    tradeType: 'sell',
                    data: response.trade,
                    date: new Date().toISOString(),
                    key: response.trade.orderId,
                    sendAccountKey: account.key,
                }),
            );
            dispatch(tradingSellActions.saveTransactionId(response.trade.orderId));
            dispatch(tradingSellActions.saveSelectedQuote(response.trade));
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }

        if (response.tradeForm?.form) {
            processResponseData(response);
        }
    },
);
