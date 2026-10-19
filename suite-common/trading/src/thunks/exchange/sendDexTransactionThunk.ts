import { isRejectedWithValue } from '@reduxjs/toolkit';
import { type ExchangeTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { buildExchangeComposeInputs } from './buildExchangeComposeInputs';
import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { type TradingSendRejectedProps } from '../../types';
import { getTradingFormState } from '../../utils';
import { tradingThunks } from '../common';
import { type RecomposeAndSignTxThunkProps } from '../common/recomposeAndSignTxThunk';

export type SendDexTransactionThunkProps = {
    account: Account;
    returnUrl: string;
    decimals: number;
    shouldSendInSats: boolean | undefined;
    setMaxOutputId?: number | undefined;
    isSlip24Active?: boolean;

    nextStep: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    triggerAnalyticsTradeConfirmation: () => void;
    signAndPushSendFormTransaction: RecomposeAndSignTxThunkProps['signAndPushSendFormTransaction'];
};

export type SendDexTransactionThunkState = TradingRootState;

export const sendDexTransactionThunk = createThunk<
    undefined,
    SendDexTransactionThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
        state: SendDexTransactionThunkState;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/sendDexTransaction`,
    async (
        {
            account,
            returnUrl,
            decimals,
            shouldSendInSats,
            setMaxOutputId,
            nextStep,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
            signAndPushSendFormTransaction,
        },
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const providers = selectTradingExchangeProviders(getState());
        const composeInputs =
            selectedQuote &&
            buildExchangeComposeInputs({
                selectedQuote,
                selectedTrade: selectedQuote,
                networkType: account.networkType,
                decimals,
                shouldSendInSats,
            });

        if (selectedQuote?.dexTx && !composeInputs) {
            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_INCORRECT_SERIALIZED_DATA' },
            });
        }

        if (
            !selectedQuote ||
            !composeInputs ||
            !selectedQuote.receiveAddress ||
            ((selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.approvalType === 'ZERO') &&
                !selectedQuote.dexTx) ||
            (selectedQuote.status !== 'APPROVAL_REQ' && selectedQuote.status !== 'CONFIRM')
        ) {
            console.error('Failed to send dex transaction - invalid quote');

            return rejectWithValue({
                type: 'error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        const tradingFormState = getTradingFormState({
            activeSection: 'exchange',
            providers,
            trade: selectedQuote,
            isSlip24Active: false,
            sendAccountKey: account.key,
            receiveAccountKey,
        });

        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                ...composeInputs.recomposeInputs,
                setMaxOutputId,
                signAndPushSendFormTransaction,
                tradingFormState,
            }),
        );

        if (isRejectedWithValue(recomposeAndSignTx) || !recomposeAndSignTx.payload?.success) {
            const { payload } = recomposeAndSignTx;

            return rejectWithValue({
                type: payload && 'type' in payload ? payload.type : 'sign-tx-error',
                error:
                    payload && 'error' in payload && 'id' in payload.error
                        ? payload.error
                        : { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        const { txid } = recomposeAndSignTx.payload.payload;
        const trade = {
            ...selectedQuote,
            receiveAddress: selectedQuote.receiveAddress, // just for type assurance
        };

        const isSwapTx =
            selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO';

        if (isSwapTx) {
            trade.receiveTxHash = txid;
            trade.status = 'CONFIRMING';

            dispatch(
                tradingActions.saveTrade({
                    tradeType: 'exchange',
                    date: new Date().toISOString(),
                    key: trade.orderId,
                    data: trade,
                    sendAccountKey,
                    receiveAccountKey,
                }),
            );
            dispatch(tradingExchangeActions.saveTransactionId(trade.orderId));

            nextStep();
        } else {
            trade.approvalSendTxHash = txid;
            trade.status = 'APPROVAL_PENDING';
        }

        await dispatch(
            confirmExchangeTradeThunk({
                trade,
                returnUrl,
                receiveAddress: trade.receiveAddress,
                account,
                isTradeSubmitted: true,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep: isSwapTx ? undefined : nextStep,
            }),
        );
    },
);
