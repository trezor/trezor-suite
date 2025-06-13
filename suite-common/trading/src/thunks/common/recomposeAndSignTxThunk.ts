import { isRejectedWithValue } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    composeSendFormTransactionFeeLevelsThunk,
    selectConvertedNetworkFeeInfo,
    selectDeviceUnavailableCapabilities,
} from '@suite-common/wallet-core';
import { Account, FormOptions, FormState } from '@suite-common/wallet-types';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';
import { Success, Unsuccessful } from '@trezor/connect';

import { tradingThunks } from '../';
import { TRADING_THUNK_PREFIX } from '../../constants';
import {
    selectTradingActiveSection,
    selectTradingComposedTransactionInfo,
    selectTradingIsSlip24Allowed,
} from '../../selectors/tradingSelectors';
import type {
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
    TradingTradeSellExchangeType,
} from '../../types';
import { cryptoIdToNetwork } from '../../utils';

type FulfillValue = Success<{ txid: string }> | Unsuccessful | undefined;

export type RecomposeAndSignTxThunkProps = {
    account: Account;
    address: string;
    amount: string;
    receiveCryptoId?: CryptoId;
    destinationTag?: string;
    ethereumDataHex?: string;
    recalculateCustomLimit?: boolean;
    ethereumAdjustGasLimit?: string;
    setMaxOutputId?: number | undefined;
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
            receiveCryptoId,
            destinationTag,
            ethereumDataHex,
            recalculateCustomLimit,
            ethereumAdjustGasLimit,
            setMaxOutputId,
            isSlip24Active = false,
            signAndPushSendFormTransaction,
        }: RecomposeAndSignTxThunkProps,
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const activeSection = selectTradingActiveSection(
            getState(),
        ) as TradingTradeSellExchangeType; // used only in the sell and exchange sections
        const { composed, selectedFee } = selectTradingComposedTransactionInfo(getState());
        const options: FormOptions[] = ['broadcast'];
        const network = getNetwork(account.symbol);
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        const unavailableCapabilities = selectDeviceUnavailableCapabilities(getState());
        const activeTradingSection = selectTradingActiveSection(
            getState(),
        ) as TradingTradeSellExchangeType;
        const isTransferEvmTxType = getEvmTransactionTextSignature(ethereumDataHex) === 'transfer';

        if (!composed || !feeInfo) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_COMPOSED_DATA',
                },
            });
        }

        // Token is being used for approval transactions unless on firmware < 2.9.0.
        // Otherwise if ethereumDataHex is present, token is not used as details are in the ethereumDataHex.
        const shouldIncludeToken =
            !!(ethereumDataHex && isTransferEvmTxType) ||
            !(ethereumDataHex && !isTransferEvmTxType && unavailableCapabilities?.['evmApproval']);

        // prepare the fee levels, set custom values from composed
        // WORKAROUND: sendFormEthereumActions and sendFormRippleActions use form outputs instead of composed transaction data
        const formState: FormState = {
            ...DEFAULT_VALUES,
            outputs: [
                {
                    ...DEFAULT_PAYMENT,
                    address,
                    amount,
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
            ethereumDataHex,
            ethereumAdjustGasLimit,
            selectedUtxos: [],
            activeTradingSection,
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

        if (!selectedFee || isRejectedWithValue(composedLevels)) {
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

        const receiveNetwork = receiveCryptoId && cryptoIdToNetwork(receiveCryptoId);
        const isPaymentRequestsAllowed = selectTradingIsSlip24Allowed(
            getState(),
            account,
            isSlip24Active,
            receiveNetwork,
        );

        const paymentRequests = isPaymentRequestsAllowed
            ? await dispatch(
                  tradingThunks.createPaymentRequestsThunk({
                      type: activeSection,
                      account,
                      composedLevels: precomposedToSign,
                  }),
              ).unwrap()
            : [];

        const resultOfSignedTransaction = await signAndPushSendFormTransaction({
            formState,
            precomposedTransaction: precomposedToSign,
            selectedAccount: account,
            paymentRequests,
        });

        return fulfillWithValue(resultOfSignedTransaction);
    },
);
