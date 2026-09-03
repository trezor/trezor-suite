import { isRejected } from '@reduxjs/toolkit';

import {
    type DeviceRootState,
    isApprovalFlowSupported,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type ComposeSendFormTransactionFeeLevelsThunkState,
    type FeesRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormOptions,
    type FormState,
    type FormStateTrading,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    isEvmApprovalTx,
    isExchangeTradingForm,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    type CreatePaymentRequestsThunkState,
    createPaymentRequestsThunk,
} from './createPaymentRequestsThunk';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import {
    selectTradingComposedTransactionInfo,
    selectTradingExchangeSelectedQuote,
    selectTradingIsSlip24Allowed,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import type {
    TradingFulfillValue,
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
} from '../../types';
import {
    getTradingFundsErrorReport,
    isTradingFundsError,
    reportTradingFundsError,
} from '../../utils/reportTradingFundsError';

export type RecomposeAndSignTxThunkProps = {
    account: Account;
    address: string;
    amount: string;
    destinationTag?: string;
    transactionData?: string;
    recalculateCustomLimit?: boolean;
    ethereumAdjustGasLimit?: string;
    setMaxOutputId?: number | undefined;
    /**
     * Indicates whether SLIP24 is active for the transaction.
     * Important: should not be used for DEX trades.
     */
    isSlip24Active?: boolean;
    tradingFormState: FormStateTrading;

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
export type RecomposeAndSignTxThunkState = ComposeSendFormTransactionFeeLevelsThunkState &
    CreatePaymentRequestsThunkState &
    DeviceRootState &
    FeesRootState &
    TradingRootState;

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
        const { composed, selectedFee } = selectTradingComposedTransactionInfo(getState());
        const options: FormOptions[] = ['broadcast'];
        const network = getNetwork(account.symbol);
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        const device = selectSelectedDevice(getState());

        const isPaymentRequestsAllowed = selectTradingIsSlip24Allowed(
            getState(),
            account,
            isSlip24Active,
        );

        if (!composed || !feeInfo) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_COMPOSED_DATA',
                },
            });
        }

        // Token is being used for approval transactions unless on firmware < 2.9.0.
        // Otherwise if transactionData is present, token is not used as details are in the transactionData.
        const shouldIncludeToken =
            !transactionData ||
            (isApprovalFlowSupported(device) && isEvmApprovalTx(transactionData));

        // prepare the fee levels, set custom values from composed
        // WORKAROUND: sendFormEthereumActions and sendFormRippleActions use form outputs instead of composed transaction data
        const formState: FormState = {
            ...DEFAULT_VALUES,
            outputs: [
                {
                    ...DEFAULT_PAYMENT,
                    address,
                    amount,
                    currency: DEFAULT_PAYMENT.currency,
                    token: shouldIncludeToken ? (composed.token?.contract ?? null) : null,
                },
            ],
            setMaxOutputId: !composed.token?.contract ? setMaxOutputId : undefined,
            selectedFee,
            feePerUnit: composed.feePerByte,
            feeLimit: composed.feeLimit ?? '',
            estimatedFeeLimit: composed.estimatedFeeLimit,
            maxFeePerGas: composed.maxFeePerGas,
            maxPriorityFeePerGas: composed.maxPriorityFeePerGas,
            options,
            destinationTag,
            transactionData,
            ethereumAdjustGasLimit,
            selectedUtxos: [],
            trading: tradingFormState,
        };

        // prepare form state for composeAction
        const composeContext = { account, network, feeInfo };

        // recalculateCustomLimit is used in case of custom fee level, when we want to keep the feePerUnit defined by the user
        // but recompute the feeLimit based on a different transaction data (for example from transactionData)
        if (recalculateCustomLimit && selectedFee === 'custom') {
            const normalLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: { ...formState, selectedFee: 'normal' },
                    composeContext,
                }),
            ).unwrap();

            if (normalLevels?.normal?.type !== 'final' || !normalLevels.normal.feeLimit) {
                const error: TradingSendRejectedProps['error'] =
                    normalLevels?.normal?.type === 'error' && normalLevels?.normal?.errorMessage
                        ? {
                              id: normalLevels.normal.errorMessage.id,
                              values: normalLevels.normal.errorMessage.values,
                          }
                        : {
                              id: 'TR_TRADING_MISSING_FEE_LEVEL',
                          };

                return rejectWithValue({
                    type: 'sign-tx-error',
                    error,
                });
            }

            formState.feeLimit = BigNumber.max(
                formState.feeLimit || '0',
                normalLevels.normal.feeLimit,
            ).toString();
        }

        // compose transaction again to recalculate fees based on real account values
        const composedLevels = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState,
                composeContext,
            }),
        );

        if (isRejected(composeSendFormTransactionFeeLevelsThunk)(composedLevels)) {
            const composeError = composedLevels.payload;

            return rejectWithValue({
                type: 'sign-tx-error',
                error: composeError?.message
                    ? {
                          id: 'TR_TRADING_COMPOSE_FAILED',
                          values: { error: composeError.message },
                      }
                    : {
                          id: 'TR_TRADING_MISSING_FEE_LEVEL',
                      },
            });
        }

        if (!selectedFee) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_FEE_LEVEL',
                },
            });
        }

        const precomposedToSign = composedLevels.payload[selectedFee];

        if (precomposedToSign?.type !== 'final') {
            const error: TradingSendRejectedProps['error'] =
                precomposedToSign?.type === 'error' && precomposedToSign.errorMessage
                    ? {
                          id: precomposedToSign.errorMessage.id,
                          values: precomposedToSign.errorMessage.values,
                      }
                    : {
                          id: 'TR_TRADING_CANNOT_CREATE_TRANSACTION',
                      };

            if (
                precomposedToSign?.type === 'error' &&
                isTradingFundsError(precomposedToSign.error)
            ) {
                const selectedQuote =
                    tradingFormState.activeSection === 'exchange'
                        ? selectTradingExchangeSelectedQuote(getState())
                        : selectTradingSellSelectedQuote(getState());

                reportTradingFundsError(
                    getTradingFundsErrorReport({
                        account,
                        activeSection: tradingFormState.activeSection,
                        composeError: precomposedToSign.error,
                        composed,
                        composedLevels: composedLevels.payload,
                        feeInfo,
                        formState,
                        provider: selectedQuote?.exchange,
                        selectedFee,
                    }),
                );
            }

            return rejectWithValue({
                type: 'sign-tx-error',
                error,
            });
        }

        // Tron fee limit is SUN and recipient-dependent — use the recomposed (real recipient) estimate.
        if (network.networkType === 'tron') {
            formState.feeLimit = precomposedToSign.estimatedFeeLimit ?? precomposedToSign.fee ?? '';
        }

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
                  ...(composed.token?.decimals
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
