import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { getUnusedAddressFromAccount } from '../../utils';
import { resolveExchangeTradeError } from '../../utils/exchange/resolveExchangeTradeError';
import { logErrorThunk } from '../common/logErrorThunk';

export type ConfirmExchangeTradeThunkProps = {
    returnUrl: string;
    receiveAddress: string;
    account: Account;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
    isTradeSubmitted?: boolean;

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
            isTradeSubmitted = false,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        }: ConfirmExchangeTradeThunkProps,
        { dispatch, getState, signal },
    ) => {
        const getCoinSymbol = (cryptoId: CryptoId) =>
            selectTradingCoinSymbolByCryptoId(getState(), cryptoId);

        triggerAnalyticsTradeConfirmation();

        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
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

            if (!trade.fromAddress) {
                trade = { ...trade, fromAddress: refundAddress };
            }
        }

        const rawResponse = await tradeApi.doExchangeTrade(
            {
                trade,
                receiveAddress,
                refundAddress,
                extraField,
                returnUrl,
                approvalFlow,
            },
            signal,
        );

        if (signal.aborted) {
            return undefined;
        }

        // invity drops DEX-specific fields on the response — preserve those the review flow needs
        const response = rawResponse && {
            ...rawResponse,
            swapSlippage: rawResponse.swapSlippage ?? trade.swapSlippage,
        };

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
            dispatch(tradingExchangeActions.saveSelectedQuote(response));

            const shouldRouteFailedTradeToDetail =
                isTradeSubmitted && response.status === 'ERROR' && !!response.orderId;

            if (shouldRouteFailedTradeToDetail) {
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
                nextStep?.();

                return undefined;
            }

            dispatch(
                logErrorThunk({
                    errorMessage: resolveExchangeTradeError(response, { getCoinSymbol }),
                    tradingType: 'exchange',
                }),
            );

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
