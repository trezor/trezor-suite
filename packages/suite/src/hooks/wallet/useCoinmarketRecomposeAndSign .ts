import { useCallback } from 'react';
import { AppState } from '@suite-types';
import { useActions, useSelector, useTranslation } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { DEFAULT_VALUES, DEFAULT_PAYMENT } from '@wallet-constants/sendForm';
import { FormState, UseSendFormState } from '@wallet-types/sendForm';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';

export const useCoinmarketRecomposeAndSign = () => {
    const { translationString } = useTranslation();
    const { addNotification, composeAction, signAction } = useActions({
        addNotification: notificationActions.addToast,
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
            selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>,
            address: string,
            amount: string,
            destinationTag?: string,
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
                        token: composed.token?.address || null,
                    },
                ],
                selectedFee,
                feePerUnit: composed.feePerByte,
                feeLimit: composed.feeLimit || '',
                estimatedFeeLimit: composed.estimatedFeeLimit,
                options: ['broadcast'],
                rippleDestinationTag: destinationTag,
            };

            // prepare form state for composeAction
            const coinFees = fees[account.symbol];
            const levels = getFeeLevels(account.networkType, coinFees);
            const feeInfo = { ...coinFees, levels };
            const formState = { account, network, feeInfo };

            // compose transaction again to recalculate fees based on real account values
            const composedLevels = await composeAction(formValues, formState as UseSendFormState);
            if (!selectedFee || !composedLevels) {
                addNotification({
                    type: 'sign-tx-error',
                    error: 'Missing level',
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
