import { useCallback } from 'react';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';

import { notificationsActions } from '@suite-common/toast-notifications';
import { DEFAULT_VALUES, DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { FormState } from '@suite-common/wallet-types';
import { getFeeLevels } from '@suite-common/wallet-utils';
import { networks } from '@suite-common/wallet-config';
import type { Account, FormOptions } from '@suite-common/wallet-types';
import { composeSendFormTransactionFeeLevelsThunk } from '@suite-common/wallet-core';

export const useCoinmarketRecomposeAndSign = () => {
    const { translationString } = useTranslation();
    const { composed, selectedFee } = useSelector(
        state => state.wallet.coinmarket.composedTransactionInfo,
    );
    const fees = useSelector(state => state.wallet.fees);
    const dispatch = useDispatch();

    const recomposeAndSign = useCallback(
        async (
            account: Account,
            address: string,
            amount: string,
            destinationTag?: string,
            ethereumDataHex?: string,
            recalcCustomLimit?: boolean,
            ethereumAdjustGasLimit?: string,
            options: FormOptions[] = ['broadcast'],
        ) => {
            const network = networks[account.symbol];

            if (!composed) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: 'Missing composed data',
                    }),
                );

                return;
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
                        token: ethereumDataHex ? null : composed.token?.contract || null, // if we pass ethereumDataHex, do not use the token, the details are in the ethereumDataHex
                    },
                ],
                selectedFee,
                feePerUnit: composed.feePerByte,
                feeLimit: composed.feeLimit || '',
                estimatedFeeLimit: composed.estimatedFeeLimit,
                options,
                rippleDestinationTag: destinationTag,
                ethereumDataHex,
                ethereumAdjustGasLimit,
                selectedUtxos: [],
            };

            // prepare form state for composeAction
            const coinFees = fees[account.symbol];
            const levels = getFeeLevels(account.networkType, coinFees);
            const feeInfo = { ...coinFees, levels };
            const composeContext = { account, network, feeInfo };

            // recalcCustomLimit is used in case of custom fee level, when we want to keep the feePerUnit defined by the user
            // but recompute the feeLimit based on a different transaction data (for example from ethereumDataHex)
            if (recalcCustomLimit && selectedFee === 'custom') {
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
                    let errorMessage: string | undefined;
                    if (
                        normalLevels?.normal?.type === 'error' &&
                        normalLevels?.normal?.errorMessage
                    ) {
                        errorMessage = translationString(
                            normalLevels.normal.errorMessage.id,
                            normalLevels.normal.errorMessage.values as { [key: string]: any },
                        );
                    }
                    if (!errorMessage) {
                        errorMessage = 'Missing fee level';
                    }
                    dispatch(
                        notificationsActions.addToast({
                            type: 'sign-tx-error',
                            error: errorMessage,
                        }),
                    );

                    return;
                }
                formState.feeLimit = normalLevels.normal.feeLimit;
            }

            // compose transaction again to recalculate fees based on real account values
            const composedLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState,
                    composeContext,
                }),
            ).unwrap();
            if (!selectedFee || !composedLevels) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: 'Missing fee level',
                    }),
                );

                return;
            }
            const precomposedToSign = composedLevels[selectedFee];

            if (!precomposedToSign || precomposedToSign.type !== 'final') {
                let errorMessage: string | undefined;
                if (precomposedToSign?.type === 'error' && precomposedToSign.errorMessage) {
                    errorMessage = translationString(
                        precomposedToSign.errorMessage.id,
                        precomposedToSign.errorMessage.values as { [key: string]: any },
                    );
                }
                if (!errorMessage) {
                    errorMessage = 'Cannot create transaction';
                }
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: errorMessage,
                    }),
                );

                return;
            }

            return dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction: precomposedToSign,
                    selectedAccount: account,
                }),
            ).unwrap();
        },
        [composed, dispatch, fees, selectedFee, translationString],
    );

    return { selectedFee, composed, recomposeAndSign };
};
