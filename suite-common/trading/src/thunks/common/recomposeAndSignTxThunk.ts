import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    composeSendFormTransactionFeeLevelsThunk,
    selectNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { Account, FormOptions, FormState } from '@suite-common/wallet-types';
import { Success, Unsuccessful } from '@trezor/connect';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { selectTradingComposedTransactionInfo } from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps, TradingSignAndPushSendFormTransactionProps } from '../../types';

type FulfillValue = Success<{ txid: string }> | Unsuccessful | undefined;

export type RecomposeAndSignTxThunkProps = {
    account: Account;
    address: string;
    amount: string;
    destinationTag?: string;
    ethereumDataHex?: string;
    recalculateCustomLimit?: boolean;
    ethereumAdjustGasLimit?: string;
    setMaxOutputId?: number | undefined;

    signAndPushSendFormTransaction: ({
        formState,
        precomposedTransaction,
        selectedAccount,
    }: TradingSignAndPushSendFormTransactionProps) => Promise<FulfillValue>;
};

/**
 * This thunk is particularly useful for scenarios where transaction details (e.g., fees, outputs) need to be recalculated
 * dynamically before signing and broadcasting the transaction. (for example for DEX trade is necessary to
 * recompose the transaction based on the ethereumDataHex, which contains the details of the trade)
 *
 * 1. Validates inputs and retrieves necessary data.
 * 2. Dynamically recomposes the transaction and recalculates fees.
 * 3. Signs the transaction and pushes it to the blockchain.
 * 4. Handles errors gracefully and provides detailed error messages.
 */
export const recomposeAndSignTxThunk = createThunk<
    FulfillValue,
    RecomposeAndSignTxThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
    }
>(
    `${TRADING_THUNK_PREFIX}/recomposeAndSignTx`,
    async (
        {
            account,
            address,
            amount,
            destinationTag,
            ethereumDataHex,
            recalculateCustomLimit,
            ethereumAdjustGasLimit,
            setMaxOutputId,
            signAndPushSendFormTransaction,
        }: RecomposeAndSignTxThunkProps,
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const { composed, selectedFee } = selectTradingComposedTransactionInfo(getState());
        const options: FormOptions[] = ['broadcast'];
        const network = getNetwork(account.symbol);
        const feeInfo = selectNetworkFeeInfo(getState(), account.symbol);

        if (!composed || !feeInfo) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_COMPOSED_DATA',
                },
            });
        }

        // prepare the fee levels, set custom values from composed
        // WORKAROUND: sendFormEthereumActions and sendFormRippleActions use form outputs instead of composed transaction data
        const formState: FormState = {
            ...DEFAULT_VALUES,
            outputs: [
                {
                    ...DEFAULT_PAYMENT,
                    address,
                    amount,
                    // if we pass ethereumDataHex, do not use the token, the details are in the ethereumDataHex
                    token: ethereumDataHex ? null : composed.token?.contract ?? null,
                },
            ],
            setMaxOutputId: !composed.token?.contract ? setMaxOutputId : undefined,
            selectedFee,
            feePerUnit: composed.feePerByte,
            feeLimit: composed.feeLimit ?? '',
            estimatedFeeLimit: composed.estimatedFeeLimit,
            options,
            rippleDestinationTag: destinationTag,
            ethereumDataHex,
            ethereumAdjustGasLimit,
            selectedUtxos: [],
            isTrading: true,
        };

        // prepare form state for composeAction
        const composeContext = { account, network, feeInfo };

        // recalculateCustomLimit is used in case of custom fee level, when we want to keep the feePerUnit defined by the user
        // but recompute the feeLimit based on a different transaction data (for example from ethereumDataHex)
        if (recalculateCustomLimit && selectedFee === 'custom') {
            const normalLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: { ...formState, selectedFee: 'normal' },
                    composeContext,
                }),
            ).unwrap();

            if (
                !normalLevels ||
                !normalLevels.normal ||
                normalLevels.normal.type !== 'final' ||
                !normalLevels.normal.feeLimit
            ) {
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

            formState.feeLimit = normalLevels.normal.feeLimit;
        }

        // compose transaction again to recalculate fees based on real account values
        const composedLevels = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState,
                composeContext,
            }),
        );

        if (!selectedFee || !composedLevels.payload || 'error' in composedLevels.payload) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_FEE_LEVEL',
                },
            });
        }

        const precomposedToSign = composedLevels.payload[selectedFee];

        if (!precomposedToSign || precomposedToSign.type !== 'final') {
            const error: TradingSendRejectedProps['error'] =
                precomposedToSign?.type === 'error' && precomposedToSign.errorMessage
                    ? {
                          id: precomposedToSign.errorMessage.id,
                          values: precomposedToSign.errorMessage.values,
                      }
                    : {
                          id: 'TR_TRADING_CANNOT_CREATE_TRANSACTION',
                      };

            return rejectWithValue({
                type: 'sign-tx-error',
                error,
            });
        }

        const resultOfSignedTransaction = await signAndPushSendFormTransaction({
            formState,
            precomposedTransaction: precomposedToSign,
            selectedAccount: account,
        });

        return fulfillWithValue(resultOfSignedTransaction);
    },
);
