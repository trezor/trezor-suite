import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';

export const ReplaceTxButton = () => {
    const { device, isLocked } = useDevice();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { account, isLoading, signTransaction, getValues, composedLevels } = useRbfContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    // The device lock is taken only once signing reaches connect, and token replacements check the
    // token definition over the network before that, so the lock alone cannot stop a second click.
    const isDisabled =
        composedTx?.type !== 'final' || isLocked() || (device && !device.available) || isSubmitting;

    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));

    const handleReplaceTx = async () => {
        setIsSubmitting(true);
        try {
            await signTransaction();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal.Button
            data-testid="@send/replace-tx-button"
            isDisabled={isDisabled}
            isLoading={isLoading || areFeesLoading || isSubmitting}
            onClick={handleReplaceTx}
        >
            <Translation id="TR_REPLACE_TX" />
        </Modal.Button>
    );
};
