import { isRejected } from '@reduxjs/toolkit';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeSendFormTransactionFeeLevelsThunkState,
    type FeesRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type FormStateTrading,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { buildTradingComposeFormState } from './buildTradingComposeFormState';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingComposedTransactionInfo } from '../../selectors/tradingSelectors';
import type { TradingSendRejectedProps } from '../../types';

export type ComposeTradingTransactionThunkProps = {
    account: Account;
    address: string;
    amount: string;
    destinationTag?: string;
    transactionData?: string;
    recalculateCustomLimit?: boolean;
    ethereumAdjustGasLimit?: string;
    setMaxOutputId?: number | undefined;
    tradingFormState: FormStateTrading;
};

export type ComposeTradingTransactionResult = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
};

export type ComposeTradingTransactionThunkState = ComposeSendFormTransactionFeeLevelsThunkState &
    DeviceRootState &
    FeesRootState &
    TradingRootState;

export const composeTradingTransactionThunk = createThunk<
    ComposeTradingTransactionResult,
    ComposeTradingTransactionThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
        state: ComposeTradingTransactionThunkState;
    }
>(
    `${TRADING_THUNK_PREFIX}/composeTradingTransaction`,
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
            tradingFormState,
        },
        { dispatch, getState, rejectWithValue, fulfillWithValue },
    ) => {
        const { composed, selectedFee } = selectTradingComposedTransactionInfo(getState());
        const network = getNetwork(account.symbol);
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        const device = selectSelectedDevice(getState());

        if (!composed || !feeInfo) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_TRADING_MISSING_COMPOSED_DATA',
                },
            });
        }

        const formState = buildTradingComposeFormState({
            account,
            device,
            address,
            amount,
            destinationTag,
            transactionData,
            ethereumAdjustGasLimit,
            setMaxOutputId,
            composed,
            selectedFee,
            tradingFormState,
        });

        const composeContext = { account, network, feeInfo };

        if (recalculateCustomLimit && selectedFee === 'custom') {
            const normalLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: { ...formState, selectedFee: 'normal' },
                    composeContext,
                }),
            );

            if (isRejected(composeSendFormTransactionFeeLevelsThunk)(normalLevels)) {
                const composeError = normalLevels.payload;

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

            const normalLevel = normalLevels.payload?.normal;

            if (normalLevel?.type !== 'final' || !normalLevel.feeLimit) {
                const error: TradingSendRejectedProps['error'] =
                    normalLevel?.type === 'error' && normalLevel?.errorMessage
                        ? {
                              id: normalLevel.errorMessage.id,
                              values: normalLevel.errorMessage.values,
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
                normalLevel.feeLimit,
            ).toString();
        }

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

            return rejectWithValue({
                type: 'sign-tx-error',
                error,
            });
        }

        if (network.networkType === 'tron') {
            formState.feeLimit = precomposedToSign.estimatedFeeLimit ?? precomposedToSign.fee ?? '';
        }

        return fulfillWithValue({ formState, precomposedTransaction: precomposedToSign });
    },
);
