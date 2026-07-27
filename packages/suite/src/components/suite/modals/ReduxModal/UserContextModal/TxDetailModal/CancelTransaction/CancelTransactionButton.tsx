import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
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
        if (composedCancelTx === null || cancelFormState === null) return;

        setIsSubmitting(true);
        try {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState: cancelFormState,
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
        isLocked() ||
        !device ||
        !device?.available ||
        composedCancelTx === null ||
        cancelFormState === null ||
        isSubmitting;

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
