import { isRejected } from '@reduxjs/toolkit';

import { type FormState } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    isCompleteTradingForm,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';
import { type Ok, exhaustive } from '@trezor/type-utils';
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
    selectTradingIsSlip24SellAllowed,
} from '../../selectors/tradingSelectors';
import type {
    TradingError,
    TradingFulfillValue,
    TradingSignAndPushError,
    TradingSignAndPushSendFormTransactionProps,
} from '../../types';
import { toTradingError } from '../../utils/tradingErrorUtils';

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

const getSignAndPushRejectionType = (
    signAndPushError: TradingSignAndPushError,
): TradingError['type'] => {
    switch (signAndPushError.error) {
        case 'push-approval-rejected':
            return 'sign-cancelled';
        case 'sign-transaction-timeout':
            return 'sign-transaction-timeout';
        case 'fee-levels-compose-failed':
        case 'enhance-transaction-failed':
        case 'sign-transaction-failed':
        case 'push-transaction-failed':
        case 'push-transaction-pending-conflict':
            return 'sign-tx-error';
        default:
            return exhaustive(signAndPushError);
    }
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
    Ok<{ txid: string }>,
    RecomposeAndSignTxThunkProps,
    {
        rejectValue: TradingError;
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

        const isPaymentRequestsAllowed =
            tradingFormState.activeSection === 'sell'
                ? selectTradingIsSlip24SellAllowed(getState(), account, isSlip24Active)
                : selectTradingIsSlip24Allowed(getState(), account, isSlip24Active);

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
                toTradingError(composeResult.payload ?? composeResult.error, {
                    type: 'sign-tx-error',
                    code: 'cannot-create-transaction',
                }),
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
        const paymentOutput =
            precomposedOutputs.find(output => 'address' in output && output.address === address) ??
            precomposedOutputs.find(output => 'address' in output);
        // Send-max is `setMaxOutputId`; `length === 1` still covers SLIP-24 CEX with no change.
        // Amount must come from the trade payment output, not OP_RETURN or change.
        const isTradedWholeBalance =
            typeof setMaxOutputId === 'number' || precomposedOutputs.length === 1;
        const sendAmount =
            isTradedWholeBalance && paymentOutput?.amount !== undefined
                ? paymentOutput.amount.toString()
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
                ...(isPaymentRequestsAllowed && isCompleteTradingForm(tradingFormState)
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
                code: 'cannot-send-transaction',
            });
        }

        if (!resultOfSignedTransaction.success) {
            return rejectWithValue({
                type: getSignAndPushRejectionType(resultOfSignedTransaction.error),
                code: 'cannot-send-transaction',
                cause: { source: 'send-form', error: resultOfSignedTransaction.error },
            });
        }

        return fulfillWithValue(resultOfSignedTransaction);
    },
);
