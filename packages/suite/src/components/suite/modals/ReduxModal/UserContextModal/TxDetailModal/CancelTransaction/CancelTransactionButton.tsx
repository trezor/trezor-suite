import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { Modal } from '@trezor/components';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useDispatch } from 'src/hooks/suite';
import { useCancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

type CancelTransactionButtonProps = {
    account: Account;
    onSuccess?: () => void;
};

export const CancelTransactionButton = ({ account, onSuccess }: CancelTransactionButtonProps) => {
    const { device, isLocked } = useDevice();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const { composedCancelTx, cancelFormState } = useCancelTxContext();

    const handleCancelTx = async () => {
        if (composedCancelTx === null) return;

        const formState: FormState = cancelFormState ?? {
            feeLimit: '', // Eth only
            feePerUnit: composedCancelTx.feePerByte,
            hasCoinControlBeenOpened: false,
            isCoinControlEnabled: false,
            options: ['broadcast'],
            outputs: composedCancelTx.outputs.map(output => ({
                ...DEFAULT_PAYMENT,
                ...output,
                amount: output.amount.toString(),
            })),
            selectedUtxos: [],
        };

        setIsSubmitting(true);
        try {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction: composedCancelTx,
                    selectedAccount: account,
                }),
            ).unwrap();

            if (result?.success) {
                onSuccess?.();
            }
        } catch {
            // errors are handled via toast notifications
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDisabled =
        isLocked() || !device || !device?.available || composedCancelTx === null || isSubmitting;

    return (
        <Modal.Button
            data-testid="@send/cancel-tx-button"
            isDisabled={isDisabled}
            isLoading={isSubmitting}
            onClick={handleCancelTx}
            intent="critical"
        >
            <Translation id="TR_CANCEL_TX_BUTTON" />
        </Modal.Button>
    );
};
