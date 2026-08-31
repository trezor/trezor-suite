import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';

import { useRbfContext } from 'src/hooks/wallet/useRbfForm';

export const ReplaceTxButton = () => {
    const { device, isLocked } = useDevice();

    const { account, isLoading, signTransaction, getValues, composedLevels } = useRbfContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled = composedTx?.type !== 'final' || isLocked() || (device && !device.available);

    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));

    return (
        <Modal.Button
            data-testid="@send/replace-tx-button"
            isDisabled={isDisabled}
            isLoading={isLoading || areFeesLoading}
            onClick={signTransaction}
        >
            <Translation id="TR_REPLACE_TX" />
        </Modal.Button>
    );
};
