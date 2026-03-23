import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';
import { logErrorThunk } from '../common/logErrorThunk';

export type ConfirmApprovalThunkProps = {
    receiveAddress: string;
    account: Account;
    extraField?: string;
    trade?: ExchangeTrade;

    processResponseData: (response: ExchangeTrade) => void;
};

export const confirmApprovalThunk = createThunk(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/confirmApproval`,
    async (
        {
            trade,
            receiveAddress,
            account,
            extraField,
            processResponseData,
        }: ConfirmApprovalThunkProps,
        { dispatch, getState },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const { address: refundAddress } = getUnusedAddressFromAccount(account);

        if (!trade) {
            trade = selectedQuote;
        }

        if (!refundAddress || !trade?.quoteId || !receiveAddress) {
            return undefined;
        }

        trade = { ...trade, receiveAddress };

        if (!trade.fromAddress) {
            trade = { ...trade, fromAddress: refundAddress };
        }

        dispatch(tradingExchangeActions.saveTransactionId(undefined));

        const response = await invityAPI.doExchangeTrade({
            trade,
            receiveAddress,
            refundAddress,
            extraField,
            returnUrl: undefined,
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

            return response;
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
        }

        return response;
    },
);
