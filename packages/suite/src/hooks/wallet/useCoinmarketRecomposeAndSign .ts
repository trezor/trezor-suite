import { useCallback } from 'react';
import { useActions, useSelector, useTranslation } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DEFAULT_VALUES, DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { FormState, UseSendFormState } from '@wallet-types/sendForm';
import { getFeeLevels } from '@suite-common/wallet-utils';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

export const useCoinmarketRecomposeAndSign = () => {
    const { translationString } = useTranslation();
    const { addNotification, composeAction, signAction } = useActions({
        addNotification: notificationsActions.addToast,
        composeAction: sendFormActions.composeTransaction,
        signAction: sendFormActions.signTransaction,
    });

    const { composed, selectedFee, fees } = useSelector(state => ({
        composed: state.wallet.coinmarket.composedTransactionInfo.composed,
        selectedFee: state.wallet.coinmarket.composedTransactionInfo.selectedFee,
        fees: state.wallet.fees,
    }));

    const recomposeAndSign = useCallback(
        async (
            selectedAccount: SelectedAccountLoaded,
            address: string,
            amount: string,
            destinationTag?: string,
            ethereumDataHex?: string,
            recalcCustomLimit?: boolean,
            ethereumAdjustGasLimit?: string,
        ) => {
            const { account, network } = selectedAccount;

            if (!composed) {
                addNotification({
                    type: 'sign-tx-error',
                    error: 'Missing composed data',
                });
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
                options: ['broadcast'],
                rippleDestinationTag: destinationTag,
                ethereumDataHex,
                ethereumAdjustGasLimit,
                selectedUtxos: [],
            };

            // prepare form state for composeAction
            const coinFees = fees[account.symbol];
            const levels = getFeeLevels(account.networkType, coinFees);
            const feeInfo = { ...coinFees, levels };
            const formState = { account, network, feeInfo };

            // recalcCustomLimit is used in case of custom fee level, when we want to keep the feePerUnit defined by the user
            // but recompute the feeLimit based on a different transaction data (for example from ethereumDataHex)
            if (recalcCustomLimit && selectedFee === 'custom') {
                const normalLevels = await composeAction(
                    { ...formValues, selectedFee: 'normal' },
                    formState as UseSendFormState,
                );
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
                    addNotification({
                        type: 'sign-tx-error',
                        error: errorMessage,
                    });
                    return;
                }
                formValues.feeLimit = normalLevels.normal.feeLimit;
            }

            // compose transaction again to recalculate fees based on real account values
            const composedLevels = await composeAction(formValues, formState as UseSendFormState);
            if (!selectedFee || !composedLevels) {
                addNotification({
                    type: 'sign-tx-error',
                    error: 'Missing fee level',
                });
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
                addNotification({
                    type: 'sign-tx-error',
                    error: errorMessage,
                });
                return;
            }

            return signAction(formValues, composedToSign);
        },
        [
            addNotification,
            composeAction,
            composed,
            fees,
            selectedFee,
            signAction,
            translationString,
        ],
    );
    return { selectedFee, composed, recomposeAndSign };
};
