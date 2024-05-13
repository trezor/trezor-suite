import { useCallback } from 'react';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';

import { notificationsActions } from '@suite-common/toast-notifications';
import { DEFAULT_VALUES, DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { FormState } from '@suite-common/wallet-types';
import type { FormOptions, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { composeSendFormTransactionThunk } from '@suite-common/wallet-core';

export const useCoinmarketRecomposeAndSign = () => {
    const { translationString } = useTranslation();
    const { composed, selectedFee } = useSelector(
        state => state.wallet.coinmarket.composedTransactionInfo,
    );
    const dispatch = useDispatch();

    const recomposeAndSign = useCallback(
        async (
            selectedAccount: SelectedAccountLoaded,
            address: string,
            amount: string,
            destinationTag?: string,
            ethereumDataHex?: string,
            recalcCustomLimit?: boolean,
            ethereumAdjustGasLimit?: string,
            options: FormOptions[] = ['broadcast'],
        ) => {
            const { account } = selectedAccount;

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
            const formValues: FormState = {
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

            // recalcCustomLimit is used in case of custom fee level, when we want to keep the feePerUnit defined by the user
            // but recompute the feeLimit based on a different transaction data (for example from ethereumDataHex)
            if (recalcCustomLimit && selectedFee === 'custom') {
                const normalLevels = await dispatch(
                    composeSendFormTransactionThunk({
                        formValues: { ...formValues, selectedFee: 'normal' },
                        accountKey: account.key,
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
                formValues.feeLimit = normalLevels.normal.feeLimit;
            }

            // compose transaction again to recalculate fees based on real account values
            const composedLevels = await dispatch(
                composeSendFormTransactionThunk({ formValues, accountKey: account.key }),
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
            const composedToSign = composedLevels[selectedFee];

            if (!composedToSign || composedToSign.type !== 'final') {
                let errorMessage: string | undefined;
                if (composedToSign?.type === 'error' && composedToSign.errorMessage) {
                    errorMessage = translationString(
                        composedToSign.errorMessage.id,
                        composedToSign.errorMessage.values as { [key: string]: any },
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
                    formValues,
                    precomposedTransaction: composedToSign,
                    selectedAccount: account,
                }),
            ).unwrap();
        },
        [composed, dispatch, selectedFee, translationString],
    );

    return { selectedFee, composed, recomposeAndSign };
};
