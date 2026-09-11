import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { type FormState } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    isExchangeTradingForm,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    type ComposeTradingTransactionThunkProps,
    type ComposeTradingTransactionThunkState,
    composeTradingTransactionThunk,
} from './composeTradingTransactionThunk';
import {
    type CreatePaymentRequestsThunkState,
    createPaymentRequestsThunk,
} from './createPaymentRequestsThunk';
import { TRADING_THUNK_PREFIX } from '../../constants';
import {
    selectTradingComposedTransactionInfo,
    selectTradingIsSlip24Allowed,
} from '../../selectors/tradingSelectors';
import type {
    TradingFulfillValue,
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
} from '../../types';

export type RecomposeAndSignTxThunkProps = ComposeTradingTransactionThunkProps & {
    /**
     * Indicates whether SLIP24 is active for the transaction.
     * Important: should not be used for DEX trades.
     */
    isSlip24Active?: boolean;

    signAndPushSendFormTransaction: ({
        formState,
        precomposedTransaction,
        selectedAccount,
        paymentRequests,
    }: TradingSignAndPushSendFormTransactionProps) => Promise<TradingFulfillValue>;
};

/**
 * This thunk is particularly useful for scenarios where transaction details (e.g., fees, outputs) need to be recalculated
 * dynamically before signing and broadcasting the transaction. (for example for DEX trade is necessary to
 * recompose the transaction based on the transactionData, which contains the details of the trade)
 *
 * 1. Validates inputs and retrieves necessary data.
 * 2. Dynamically recomposes the transaction and recalculates fees.
 * 3. Signs the transaction and pushes it to the blockchain.
 * 4. Handles errors gracefully and provides detailed error messages.
 */
export type RecomposeAndSignTxThunkState = ComposeTradingTransactionThunkState &
    CreatePaymentRequestsThunkState;

export const recomposeAndSignTxThunk = createThunk<
    TradingFulfillValue,
    RecomposeAndSignTxThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
        state: RecomposeAndSignTxThunkState;
    }
>(
    `${TRADING_THUNK_PREFIX}/recomposeAndSignTx`,
    async (
        {
            account,
            address,
            amount,
            destinationTag,
            transactionData,
            recalculateCustomLimit,
            ethereumAdjustGasLimit,
            setMaxOutputId,
            isSlip24Active = false,
            tradingFormState,
            signAndPushSendFormTransaction,
        },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const { composed } = selectTradingComposedTransactionInfo(getState());

        const isPaymentRequestsAllowed = selectTradingIsSlip24Allowed(
            getState(),
            account,
            isSlip24Active,
        );

        const composeResult = await dispatch(
            composeTradingTransactionThunk({
                account,
                address,
                amount,
                destinationTag,
                transactionData,
                recalculateCustomLimit,
                ethereumAdjustGasLimit,
                setMaxOutputId,
                tradingFormState,
            }),
        );

        if (isRejected(composeTradingTransactionThunk)(composeResult)) {
            return rejectWithValue(
                composeResult.payload ?? {
                    type: 'sign-tx-error',
                    error: { id: 'TR_TRADING_CANNOT_CREATE_TRANSACTION' },
                },
            );
        }

        const { formState, precomposedTransaction: precomposedToSign } = composeResult.payload;

        /*
            SLIP-24 to achieve the consistent trade data
            ---
            If the transaction is a trade of whole balance, we need to set the amount to
            the formState (displayed in the UI) and for the payment requests to
            ensure that the payment requests are created with the correct amount.
        */
        const { outputs: precomposedOutputs } = precomposedToSign;
        const isTradedWholeBalance = precomposedOutputs.length === 1; // sending whole balance
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstPrecomposedOutput: (typeof precomposedOutputs)[number] = precomposedOutputs[0];
        const sendAmount = isTradedWholeBalance
            ? firstPrecomposedOutput.amount.toString()
            : undefined;
        const formattedMaxAmount = sendAmount
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(sendAmount)),
                  symbol: account.symbol,
                  ...(composed?.token?.decimals
                      ? { decimals: composed.token?.decimals }
                      : undefined),
              }).toString()
            : undefined;

        const formStateUpdated: FormState = {
            ...formState,
            trading: {
                ...tradingFormState,
                ...(isPaymentRequestsAllowed && isExchangeTradingForm(tradingFormState)
                    ? {
                          send: {
                              ...tradingFormState.send,
                              amount: formattedMaxAmount ?? tradingFormState.send.amount,
                          },
                      }
                    : {}),
            },
        };

        const paymentRequests = isPaymentRequestsAllowed
            ? await dispatch(
                  createPaymentRequestsThunk({
                      type: tradingFormState.activeSection,
                      account,
                      composedLevels: precomposedToSign,
                      formattedMaxAmount,
                      destinationTag,
                  }),
              ).unwrap()
            : [];

        const resultOfSignedTransaction = await signAndPushSendFormTransaction({
            formState: formStateUpdated,
            precomposedTransaction: precomposedToSign,
            selectedAccount: account,
            paymentRequests,
        });

        if (!resultOfSignedTransaction) {
            return rejectWithValue({
                type: 'sign-cancelled',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
        }

        return fulfillWithValue(resultOfSignedTransaction);
    },
);
