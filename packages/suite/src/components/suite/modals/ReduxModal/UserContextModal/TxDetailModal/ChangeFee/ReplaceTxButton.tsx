import { NewModal } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';

import { useRbfContext } from '../../../../../../../hooks/wallet/useRbfForm';

export const ReplaceTxButton = () => {
    const { device, isLocked } = useDevice();

    const { isLoading, signTransaction, getValues, composedLevels } = useRbfContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled =
        !composedTx || composedTx.type !== 'final' || isLocked() || (device && !device.available);

    return (
        <NewModal.Button
            data-testid="@send/replace-tx-button"
            isDisabled={isDisabled || isLoading}
            onClick={signTransaction}
        >
            <Translation id="TR_REPLACE_TX" />
        </NewModal.Button>
    );
};
