import { isRejected } from '@reduxjs/toolkit';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeFeeLevelsError,
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
import { createThunk } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { buildTradingComposeFormState } from './buildTradingComposeFormState';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingComposedTransactionInfo } from '../../selectors/tradingSelectors';
import type { TradingError, TradingErrorCause } from '../../types';

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
    assumeNewAccount?: boolean;
};

export type ComposeTradingTransactionResult = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
};

type PrecomposeErrorMessage = Extract<TradingErrorCause, { source: 'precompose' }>['errorMessage'];

const getPrecomposeCause = (
    errorMessage: PrecomposeErrorMessage | undefined,
): TradingErrorCause | undefined => errorMessage && { source: 'precompose', errorMessage };

const getComposeFailure = (composeError: ComposeFeeLevelsError | undefined): TradingError => ({
    type: 'sign-tx-error',
    code: composeError?.message ? 'compose-failed' : 'missing-fee-level',
    cause: composeError && { source: 'send-form', error: composeError },
});

export type ComposeTradingTransactionThunkState = ComposeSendFormTransactionFeeLevelsThunkState &
    DeviceRootState &
    FeesRootState &
    TradingRootState;

export const composeTradingTransactionThunk = createThunk<
    ComposeTradingTransactionResult,
    ComposeTradingTransactionThunkProps,
    {
        rejectValue: TradingError;
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
            assumeNewAccount,
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
                code: 'missing-composed-data',
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

        const composeContext = { account, network, feeInfo, assumeNewAccount };

        if (recalculateCustomLimit && selectedFee === 'custom') {
            const normalLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: { ...formState, selectedFee: 'normal' },
                    composeContext,
                }),
            );

            if (isRejected(composeSendFormTransactionFeeLevelsThunk)(normalLevels)) {
                return rejectWithValue(getComposeFailure(normalLevels.payload));
            }

            const normalLevel = normalLevels.payload?.normal;

            if (normalLevel?.type !== 'final' || !normalLevel.feeLimit) {
                return rejectWithValue({
                    type: 'sign-tx-error',
                    code: 'missing-fee-level',
                    cause: getPrecomposeCause(
                        normalLevel?.type === 'error' ? normalLevel.errorMessage : undefined,
                    ),
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
            return rejectWithValue(getComposeFailure(composedLevels.payload));
        }

        if (!selectedFee) {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'missing-fee-level',
            });
        }

        const precomposedToSign = composedLevels.payload[selectedFee];

        if (precomposedToSign?.type !== 'final') {
            return rejectWithValue({
                type: 'sign-tx-error',
                code: 'cannot-create-transaction',
                cause: getPrecomposeCause(
                    precomposedToSign?.type === 'error'
                        ? precomposedToSign.errorMessage
                        : undefined,
                ),
            });
        }

        if (network.networkType === 'tron') {
            formState.feeLimit = precomposedToSign.estimatedFeeLimit ?? precomposedToSign.fee ?? '';
        }

        return fulfillWithValue({ formState, precomposedTransaction: precomposedToSign });
    },
);
