import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';
import { logErrorThunk } from '../common/logErrorThunk';

export type ConfirmExchangeTradeThunkProps = {
    returnUrl: string;
    receiveAddress: string;
    account: Account;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;

    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    nextStep?: () => void;
};

export const confirmExchangeTradeThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/confirmTrade`,
    async (
        {
            trade,
            returnUrl,
            receiveAddress,
            account,
            extraField,
            approvalFlow = false,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        }: ConfirmExchangeTradeThunkProps,
        { dispatch, getState },
    ) => {
        triggerAnalyticsTradeConfirmation();

        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const selectedQuoteRequestData = selectTradingExchangeQuotesRequest(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const { address: refundAddress } = getUnusedAddressFromAccount(account);

        if (!trade) {
            trade = selectedQuote;
        }

        if (!trade || !refundAddress || !trade.quoteId) {
            return undefined;
        }

        if (trade.isDex) {
            trade = { ...trade, receiveAddress };

            if (selectedQuoteRequestData?.fromAddress) {
                trade = { ...trade, fromAddress: selectedQuoteRequestData.fromAddress };
            } else if (!trade.fromAddress) {
                trade = { ...trade, fromAddress: refundAddress };
            }
        }

        const response = await invityAPI.doExchangeTrade({
            trade,
            receiveAddress,
            refundAddress,
            extraField,
            returnUrl,
            approvalFlow,
        });

        if (!response) {
            dispatch(
                logErrorThunk({
                    errorMessage: 'No response from the server',
                    tradingType: 'exchange',
                }),
            );

            return undefined;
        }

        if (
            response.error ||
            !response.status ||
            !response.orderId ||
            response.status === 'ERROR'
        ) {
            dispatch(
                logErrorThunk({
                    errorMessage: response.error || 'Error response from the server',
                    tradingType: 'exchange',
                }),
            );
            dispatch(tradingExchangeActions.saveSelectedQuote(response));

            return undefined;
        }

        if (response.status === 'APPROVAL_REQ' || response.status === 'APPROVAL_PENDING') {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));

            return response;
        }

        if (response.status === 'SIGN_DATA') {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));
            dispatch(tradingExchangeActions.setFormStep('SIGN_DATA'));

            return response;
        }

        if (response.status === 'CONFIRM') {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));
            dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));

            return response;
        }

        // CONFIRMING, SUCCESS, LOADING
        dispatch(tradingExchangeActions.saveSelectedQuote(response));
        dispatch(
            tradingActions.saveTrade({
                tradeType: 'exchange',
                date: new Date().toISOString(),
                key: response.orderId,
                data: response,
                sendAccountKey,
                receiveAccountKey,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(response.orderId));

        if (response.tradeForm?.form) {
            processResponseData(response);

            return response;
        }
        if (response.status === 'LOADING') {
            dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));

            return response;
        }

        nextStep?.();

        return response;
    },
);
