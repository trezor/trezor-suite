import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeFormStep,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';

export type ConfirmExchangeTradeThunkProps = {
    returnUrl: string;
    receiveAddress: string;
    account: Account;
    extraField?: string;
    trade?: ExchangeTrade;

    triggerAnalyticsTradeConfirmation: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    nextStep: () => void;
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
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        }: ConfirmExchangeTradeThunkProps,
        { dispatch, getState },
    ) => {
        triggerAnalyticsTradeConfirmation();

        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const quotesRequest = selectTradingExchangeQuotesRequest(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const formStep = selectTradingExchangeFormStep(getState());
        const { address: refundAddress } = getUnusedAddressFromAccount(account);

        let isConfirmationOk = false;

        if (!trade) {
            trade = selectedQuote;
        }

        if (!quotesRequest || !trade || !refundAddress || !trade.quoteId) {
            return isConfirmationOk;
        }

        if (trade.isDex && !trade.fromAddress) {
            trade = { ...trade, fromAddress: refundAddress };
        }

        dispatch(tradingExchangeActions.saveTransactionId(undefined));

        const response = await invityAPI.doExchangeTrade({
            trade,
            receiveAddress,
            refundAddress,
            extraField,
            returnUrl,
        });

        if (!response) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'No response from the server',
                }),
            );

            return isConfirmationOk;
        }

        if (
            response.error ||
            !response.status ||
            !response.orderId ||
            response.status === 'ERROR'
        ) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: response.error || 'Error response from the server',
                }),
            );
            dispatch(tradingExchangeActions.saveSelectedQuote(response));

            return isConfirmationOk;
        }

        isConfirmationOk = true; // is should be true from this moment - errors are handled above

        if (response.status === 'APPROVAL_REQ' || response.status === 'APPROVAL_PENDING') {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));
            dispatch(tradingExchangeActions.setFormStep('SEND_APPROVAL_TRANSACTION'));

            return isConfirmationOk;
        }

        if (response.status === 'SIGN_DATA') {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));
            dispatch(tradingExchangeActions.setFormStep('SIGN_DATA'));

            return isConfirmationOk;
        }

        if (response.status === 'CONFIRM' && !response.isDex) {
            dispatch(tradingExchangeActions.saveSelectedQuote(response));
            dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));

            return isConfirmationOk;
        }

        if (response.status === 'CONFIRM' && response.isDex) {
            const isApprovalActive =
                formStep === 'RECEIVING_ADDRESS' || trade.approvalType === 'ZERO';

            dispatch(tradingExchangeActions.saveSelectedQuote(response));

            if (isApprovalActive) {
                dispatch(tradingExchangeActions.setFormStep('SEND_APPROVAL_TRANSACTION'));
            } else {
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
            }

            return isConfirmationOk;
        }

        // CONFIRMING, SUCCESS, LOADING
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

            return isConfirmationOk;
        }
        if (response.status === 'LOADING') {
            dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));

            return isConfirmationOk;
        }

        nextStep();

        return isConfirmationOk;
    },
);
