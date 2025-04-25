import { SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from '@suite-common/wallet-types';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
} from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';

export type HandleSellTradeThunkProps = {
    account: Account;
    quote: SellFiatTrade;
    returnUrl: string;

    processResponseData: (response: SellFiatTradeResponse) => void;
};

export const handleSellTradeThunk = createThunk(
    `${TRADING_SELL_THUNK_PREFIX}/handleTrade`,
    async (
        { account, quote, returnUrl, processResponseData }: HandleSellTradeThunkProps,
        { dispatch, getState, fulfillWithValue },
    ) => {
        const sellInfo = selectTradingSellInfo(getState());
        const quotesRequest = selectTradingSellQuotesRequest(getState());
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;

        const response = await invityAPI.doSellTrade({
            trade: { ...quote, refundAddress: getUnusedAddressFromAccount(account).address },
            returnUrl,
        });

        if (!response.trade) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'No response from the server',
                }),
            );

            return;
        }

        if (response.trade.error && response.trade.status !== 'LOGIN_REQUEST') {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: response.trade.error,
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
                    account: {
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        accountType: account.accountType,
                        accountIndex: account.index,
                    },
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
