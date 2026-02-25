import { isRejectedWithValue } from '@reduxjs/toolkit';
import { ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { ETHEREUM_ADJUST_GAS_LIMIT } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { confirmExchangeTradeThunk } from './confirmExchangeTradeThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeAccountKey,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps } from '../../types';
import { getTradingFormState } from '../../utils';
import { tradingThunks } from '../common';
import { RecomposeAndSignTxThunkProps } from '../common/recomposeAndSignTxThunk';

export type SendDexTransactionThunkProps = {
    account: Account;
    returnUrl: string;
    setMaxOutputId?: number | undefined;
    isSlip24Active?: boolean;

    nextStep: () => void;
    processResponseData: (response: ExchangeTrade) => void;
    triggerAnalyticsTradeConfirmation: () => void;
    signAndPushSendFormTransaction: RecomposeAndSignTxThunkProps['signAndPushSendFormTransaction'];
};

export const sendDexTransactionThunk = createThunk<
    undefined,
    SendDexTransactionThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/sendDexTransaction`,
    async (
        {
            account,
            returnUrl,
            setMaxOutputId,
            nextStep,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
            signAndPushSendFormTransaction,
        }: SendDexTransactionThunkProps,
        { dispatch, getState, rejectWithValue },
    ) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const sendAccountKey = selectTradingExchangeAccountKey(getState());
        const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
        const providers = selectTradingExchangeProviders(getState());

        if (
            !selectedQuote ||
            !selectedQuote.dexTx ||
            !selectedQuote.receiveAddress ||
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

        let serializedTx = selectedQuote.dexTx.data;
        if (account.networkType === 'solana' && serializedTx) {
            // let's assume data obtained from trading api are always base64
            // convert from base64 to hex (base16)
            try {
                const transactionBuffer = Buffer.from(serializedTx, 'base64');
                serializedTx = transactionBuffer.toString('hex');
            } catch (error) {
                console.error(error);

                return rejectWithValue({
                    type: 'error',
                    error: { id: 'TR_TRADING_INCORRECT_SERIALIZED_DATA' },
                });
            }
        }

        // after discussion with 1inch, adjust the gas limit by the factor of 1.25
        // swap can use different swap paths when mining tx than when estimating tx
        // the geth gas estimate may be too low
        const recomposeAndSignTx = await dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: selectedQuote.dexTx.to,
                amount: selectedQuote.dexTx.value,
                destinationTag: selectedQuote.partnerPaymentExtraId,
                recalculateCustomLimit: true,
                ethereumAdjustGasLimit:
                    selectedQuote.status === 'CONFIRM' ? ETHEREUM_ADJUST_GAS_LIMIT : undefined,
                setMaxOutputId,
                signAndPushSendFormTransaction,
                tradingFormState,
                transactionData: serializedTx,
            }),
        );

        if (isRejectedWithValue(recomposeAndSignTx) || !recomposeAndSignTx.payload?.success) {
            const { payload } = recomposeAndSignTx;

            console.error('Failed to send dex transaction - sign tx error');

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

        if (selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO') {
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
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    },
);
